import { Injectable } from '@nestjs/common';
import type { NcContext } from '~/interface/config';
import { Permission } from '~/models';
import { PermissionEntity, PermissionKey } from 'nocodb-sdk';
import { NcError } from '~/helpers/catchError';

@Injectable()
export class PermissionsService {
  async permissionList(context: NcContext, baseId: string) {
    return await Permission.list(context, baseId);
  }

  async permissionGet(context: NcContext, permissionId: string) {
    const permission = await Permission.get(context, permissionId);
    if (!permission) {
      NcError.permissionNotFound(permissionId);
    }
    return permission;
  }

  async tablePermissionList(context: NcContext, tableId: string) {
    return await Permission.listByEntity(
      context,
      PermissionEntity.TABLE,
      tableId,
    );
  }

  async fieldPermissionList(context: NcContext, columnId: string) {
    return await Permission.listByEntity(
      context,
      PermissionEntity.FIELD,
      columnId,
    );
  }

  async tablePermissionCreate(
    context: NcContext,
    tableId: string,
    body: {
      permission: PermissionKey;
      granted_type: string;
      granted_role?: string;
      subjects?: Array<{ type: string; id: string }>;
      enforce_for_form?: boolean;
      enforce_for_automation?: boolean;
    },
  ) {
    // Validate permission type for table
    const validTablePermissions = [
      PermissionKey.TABLE_RECORD_ADD,
      PermissionKey.TABLE_RECORD_DELETE,
    ];
    if (!validTablePermissions.includes(body.permission)) {
      NcError.badRequest(
        `Invalid permission type for table. Valid types: ${validTablePermissions.join(', ')}`,
      );
    }

    return await Permission.insert(context, {
      entity: PermissionEntity.TABLE,
      entity_id: tableId,
      permission: body.permission,
      granted_type: body.granted_type as any,
      granted_role: body.granted_role as any,
      subjects: body.subjects,
      enforce_for_form:
        body.enforce_for_form !== undefined ? body.enforce_for_form : true,
      enforce_for_automation:
        body.enforce_for_automation !== undefined
          ? body.enforce_for_automation
          : true,
      created_by: context.user?.id,
    });
  }

  async fieldPermissionCreate(
    context: NcContext,
    columnId: string,
    body: {
      permission: PermissionKey;
      granted_type: string;
      granted_role?: string;
      subjects?: Array<{ type: string; id: string }>;
      enforce_for_form?: boolean;
      enforce_for_automation?: boolean;
    },
  ) {
    // Validate permission type for field
    const validFieldPermissions = [PermissionKey.RECORD_FIELD_EDIT];
    if (!validFieldPermissions.includes(body.permission)) {
      NcError.badRequest(
        `Invalid permission type for field. Valid types: ${validFieldPermissions.join(', ')}`,
      );
    }

    return await Permission.insert(context, {
      entity: PermissionEntity.FIELD,
      entity_id: columnId,
      permission: body.permission,
      granted_type: body.granted_type as any,
      granted_role: body.granted_role as any,
      subjects: body.subjects,
      enforce_for_form:
        body.enforce_for_form !== undefined ? body.enforce_for_form : true,
      enforce_for_automation:
        body.enforce_for_automation !== undefined
          ? body.enforce_for_automation
          : true,
      created_by: context.user?.id,
    });
  }

  async permissionUpdate(
    context: NcContext,
    permissionId: string,
    body: {
      permission?: PermissionKey;
      granted_type?: string;
      granted_role?: string;
      subjects?: Array<{ type: string; id: string }>;
      enforce_for_form?: boolean;
      enforce_for_automation?: boolean;
    },
  ) {
    const permission = await Permission.get(context, permissionId);
    if (!permission) {
      NcError.permissionNotFound(permissionId);
    }

    return await Permission.update(context, permissionId, {
      permission: body.permission,
      granted_type: body.granted_type as any,
      granted_role: body.granted_role as any,
      subjects: body.subjects,
      enforce_for_form: body.enforce_for_form,
      enforce_for_automation: body.enforce_for_automation,
    });
  }

  async permissionDelete(context: NcContext, permissionId: string) {
    const permission = await Permission.get(context, permissionId);
    if (!permission) {
      NcError.permissionNotFound(permissionId);
    }

    await Permission.delete(context, permissionId);
    return { message: 'Permission deleted successfully' };
  }
}
