import type {
  PermissionEntity,
  PermissionGrantedType,
  PermissionKey,
  PermissionRole,
} from 'nocodb-sdk';
import type { NcContext } from '~/interface/config';
import Noco from '~/Noco';
import {
  CacheDelDirection,
  CacheGetType,
  CacheScope,
  MetaTable,
} from '~/utils/globals';
import NocoCache from '~/cache/NocoCache';
import { extractProps } from '~/helpers/extractProps';

export default class Permission {
  id: string;
  fk_workspace_id: string;
  base_id: string;
  entity: PermissionEntity;
  entity_id: string;
  permission: PermissionKey;
  created_by: string;
  enforce_for_form: boolean;
  enforce_for_automation: boolean;
  granted_type: PermissionGrantedType;
  granted_role: PermissionRole;

  subjects?: {
    type: 'user' | 'group';
    id: string;
  }[];

  constructor(permission: Permission) {
    Object.assign(this, permission);
  }

  public static async list(
    context: NcContext,
    baseId: string,
    ncMeta = Noco.ncMeta,
  ): Promise<Permission[]> {
    const cachedList = await NocoCache.getList(CacheScope.PERMISSION, [
      baseId,
    ]);
    let { list: data } = cachedList;
    const { isNoneList } = cachedList;

    if (!isNoneList && !data.length) {
      data = await ncMeta.metaList2(
        context.workspace_id,
        context.base_id,
        MetaTable.PERMISSIONS,
        {
          condition: { base_id: baseId },
        },
      );

      // Load subjects for each permission
      for (const permission of data) {
        const subjects = await ncMeta.metaList2(
          context.workspace_id,
          context.base_id,
          MetaTable.PERMISSION_SUBJECTS,
          {
            condition: { fk_permission_id: permission.id },
          },
        );
        permission.subjects = subjects.map((s) => ({
          type: s.subject_type,
          id: s.subject_id,
        }));
      }

      await NocoCache.setList(CacheScope.PERMISSION, [baseId], data);
    }

    return data?.map((p) => new Permission(p)) || [];
  }

  public static async get(
    context: NcContext,
    permissionId: string,
    ncMeta = Noco.ncMeta,
  ): Promise<Permission> {
    let data = await NocoCache.get(
      `${CacheScope.PERMISSION}:${permissionId}`,
      CacheGetType.TYPE_OBJECT,
    );

    if (!data) {
      data = await ncMeta.metaGet2(
        context.workspace_id,
        context.base_id,
        MetaTable.PERMISSIONS,
        permissionId,
      );

      if (data) {
        const subjects = await ncMeta.metaList2(
          context.workspace_id,
          context.base_id,
          MetaTable.PERMISSION_SUBJECTS,
          {
            condition: { fk_permission_id: data.id },
          },
        );
        data.subjects = subjects.map((s) => ({
          type: s.subject_type,
          id: s.subject_id,
        }));

        await NocoCache.set(`${CacheScope.PERMISSION}:${permissionId}`, data);
      }
    }

    return data && new Permission(data);
  }

  public static async insert(
    context: NcContext,
    permission: Partial<Permission>,
    ncMeta = Noco.ncMeta,
  ): Promise<Permission> {
    const insertObj = extractProps(permission, [
      'fk_workspace_id',
      'base_id',
      'entity',
      'entity_id',
      'permission',
      'created_by',
      'enforce_for_form',
      'enforce_for_automation',
      'granted_type',
      'granted_role',
    ]);

    if (!insertObj.fk_workspace_id) {
      insertObj.fk_workspace_id = context.workspace_id;
    }
    if (!insertObj.base_id) {
      insertObj.base_id = context.base_id;
    }

    const { id } = await ncMeta.metaInsert2(
      context.workspace_id,
      context.base_id,
      MetaTable.PERMISSIONS,
      insertObj,
    );

    // Insert subjects if provided
    if (permission.subjects && permission.subjects.length > 0) {
      for (const subject of permission.subjects) {
        await ncMeta.metaInsert2(
          context.workspace_id,
          context.base_id,
          MetaTable.PERMISSION_SUBJECTS,
          {
            fk_permission_id: id,
            subject_type: subject.type,
            subject_id: subject.id,
            fk_workspace_id: context.workspace_id,
            base_id: context.base_id,
          },
        );
      }
    }

    // Clear cache
    await NocoCache.del(`${CacheScope.PERMISSION}:${context.base_id}:list`);

    return this.get(context, id, ncMeta);
  }

  public static async update(
    context: NcContext,
    permissionId: string,
    permission: Partial<Permission>,
    ncMeta = Noco.ncMeta,
  ): Promise<Permission> {
    const updateObj = extractProps(permission, [
      'entity',
      'entity_id',
      'permission',
      'enforce_for_form',
      'enforce_for_automation',
      'granted_type',
      'granted_role',
    ]);

    await ncMeta.metaUpdate(
      context.workspace_id,
      context.base_id,
      MetaTable.PERMISSIONS,
      updateObj,
      permissionId,
    );

    // Update subjects if provided
    if (permission.subjects !== undefined) {
      // Delete existing subjects
      await ncMeta.metaDelete(
        context.workspace_id,
        context.base_id,
        MetaTable.PERMISSION_SUBJECTS,
        {
          fk_permission_id: permissionId,
        },
      );

      // Insert new subjects
      if (permission.subjects.length > 0) {
        for (const subject of permission.subjects) {
          await ncMeta.metaInsert2(
            context.workspace_id,
            context.base_id,
            MetaTable.PERMISSION_SUBJECTS,
            {
              fk_permission_id: permissionId,
              subject_type: subject.type,
              subject_id: subject.id,
              fk_workspace_id: context.workspace_id,
              base_id: context.base_id,
            },
          );
        }
      }
    }

    // Clear cache
    await NocoCache.deepDel(
      `${CacheScope.PERMISSION}:${permissionId}`,
      CacheDelDirection.CHILD_TO_PARENT,
    );

    return this.get(context, permissionId, ncMeta);
  }

  public static async delete(
    context: NcContext,
    permissionId: string,
    ncMeta = Noco.ncMeta,
  ): Promise<boolean> {
    // Delete subjects first
    await ncMeta.metaDelete(
      context.workspace_id,
      context.base_id,
      MetaTable.PERMISSION_SUBJECTS,
      {
        fk_permission_id: permissionId,
      },
    );

    // Delete permission
    await ncMeta.metaDelete(
      context.workspace_id,
      context.base_id,
      MetaTable.PERMISSIONS,
      permissionId,
    );

    // Clear cache
    await NocoCache.deepDel(
      `${CacheScope.PERMISSION}:${permissionId}`,
      CacheDelDirection.CHILD_TO_PARENT,
    );

    return true;
  }

  public static async getByEntity(
    context: NcContext,
    entity: PermissionEntity,
    entityId: string,
    permission: PermissionKey,
    ncMeta = Noco.ncMeta,
  ): Promise<Permission> {
    const cacheKey = `${CacheScope.PERMISSION}:${entity}:${entityId}:${permission}`;
    let data = await NocoCache.get(cacheKey, CacheGetType.TYPE_OBJECT);

    if (!data) {
      data = await ncMeta.metaGet2(
        context.workspace_id,
        context.base_id,
        MetaTable.PERMISSIONS,
        {
          entity,
          entity_id: entityId,
          permission,
        },
      );

      if (data) {
        const subjects = await ncMeta.metaList2(
          context.workspace_id,
          context.base_id,
          MetaTable.PERMISSION_SUBJECTS,
          {
            condition: { fk_permission_id: data.id },
          },
        );
        data.subjects = subjects.map((s) => ({
          type: s.subject_type,
          id: s.subject_id,
        }));

        await NocoCache.set(cacheKey, data);
      }
    }

    return data && new Permission(data);
  }

  public static async listByEntity(
    context: NcContext,
    entity: PermissionEntity,
    entityId: string,
    ncMeta = Noco.ncMeta,
  ): Promise<Permission[]> {
    const cacheKey = `${CacheScope.PERMISSION}:${entity}:${entityId}:list`;
    const cachedList = await NocoCache.getList(CacheScope.PERMISSION, [
      entity,
      entityId,
    ]);
    let { list: data } = cachedList;
    const { isNoneList } = cachedList;

    if (!isNoneList && !data.length) {
      data = await ncMeta.metaList2(
        context.workspace_id,
        context.base_id,
        MetaTable.PERMISSIONS,
        {
          condition: {
            entity,
            entity_id: entityId,
          },
        },
      );

      // Load subjects for each permission
      for (const perm of data) {
        const subjects = await ncMeta.metaList2(
          context.workspace_id,
          context.base_id,
          MetaTable.PERMISSION_SUBJECTS,
          {
            condition: { fk_permission_id: perm.id },
          },
        );
        perm.subjects = subjects.map((s) => ({
          type: s.subject_type,
          id: s.subject_id,
        }));
      }

      await NocoCache.setList(
        CacheScope.PERMISSION,
        [entity, entityId],
        data,
      );
    }

    return data?.map((p) => new Permission(p)) || [];
  }
}
