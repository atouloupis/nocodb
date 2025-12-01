import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  Param,
  Patch,
  Post,
  UseGuards,
} from '@nestjs/common';
import { GlobalGuard } from '~/guards/global/global.guard';
import { PagedResponseImpl } from '~/helpers/PagedResponse';
import { PermissionsService } from '~/services/permissions.service';
import { Acl } from '~/middlewares/extract-ids/extract-ids.middleware';
import { MetaApiLimiterGuard } from '~/guards/meta-api-limiter.guard';
import { TenantContext } from '~/decorators/tenant-context.decorator';
import { NcContext } from '~/interface/config';

@Controller()
@UseGuards(MetaApiLimiterGuard, GlobalGuard)
export class PermissionsController {
  constructor(protected readonly permissionsService: PermissionsService) {}

  @Get([
    '/api/v1/db/meta/bases/:baseId/permissions',
    '/api/v2/meta/bases/:baseId/permissions',
  ])
  @Acl('baseGet')
  async permissionList(
    @TenantContext() context: NcContext,
    @Param('baseId') baseId: string,
  ) {
    return new PagedResponseImpl(
      await this.permissionsService.permissionList(context, baseId),
    );
  }

  @Get([
    '/api/v1/db/meta/permissions/:permissionId',
    '/api/v2/meta/permissions/:permissionId',
  ])
  @Acl('baseGet')
  async permissionGet(
    @TenantContext() context: NcContext,
    @Param('permissionId') permissionId: string,
  ) {
    return await this.permissionsService.permissionGet(context, permissionId);
  }

  @Get([
    '/api/v1/db/meta/tables/:tableId/permissions',
    '/api/v2/meta/tables/:tableId/permissions',
  ])
  @Acl('tableGet')
  async tablePermissionList(
    @TenantContext() context: NcContext,
    @Param('tableId') tableId: string,
  ) {
    return new PagedResponseImpl(
      await this.permissionsService.tablePermissionList(context, tableId),
    );
  }

  @Get([
    '/api/v1/db/meta/columns/:columnId/permissions',
    '/api/v2/meta/columns/:columnId/permissions',
  ])
  @Acl('columnList')
  async fieldPermissionList(
    @TenantContext() context: NcContext,
    @Param('columnId') columnId: string,
  ) {
    return new PagedResponseImpl(
      await this.permissionsService.fieldPermissionList(context, columnId),
    );
  }

  @Post([
    '/api/v1/db/meta/tables/:tableId/permissions',
    '/api/v2/meta/tables/:tableId/permissions',
  ])
  @HttpCode(200)
  @Acl('dataUpdate')
  async tablePermissionCreate(
    @TenantContext() context: NcContext,
    @Param('tableId') tableId: string,
    @Body() body: any,
  ) {
    return await this.permissionsService.tablePermissionCreate(
      context,
      tableId,
      body,
    );
  }

  @Post([
    '/api/v1/db/meta/columns/:columnId/permissions',
    '/api/v2/meta/columns/:columnId/permissions',
  ])
  @HttpCode(200)
  @Acl('dataUpdate')
  async fieldPermissionCreate(
    @TenantContext() context: NcContext,
    @Param('columnId') columnId: string,
    @Body() body: any,
  ) {
    return await this.permissionsService.fieldPermissionCreate(
      context,
      columnId,
      body,
    );
  }

  @Patch([
    '/api/v1/db/meta/permissions/:permissionId',
    '/api/v2/meta/permissions/:permissionId',
  ])
  @Acl('dataUpdate')
  async permissionUpdate(
    @TenantContext() context: NcContext,
    @Param('permissionId') permissionId: string,
    @Body() body: any,
  ) {
    return await this.permissionsService.permissionUpdate(
      context,
      permissionId,
      body,
    );
  }

  @Delete([
    '/api/v1/db/meta/permissions/:permissionId',
    '/api/v2/meta/permissions/:permissionId',
  ])
  @Acl('dataUpdate')
  async permissionDelete(
    @TenantContext() context: NcContext,
    @Param('permissionId') permissionId: string,
  ) {
    return await this.permissionsService.permissionDelete(
      context,
      permissionId,
    );
  }
}
