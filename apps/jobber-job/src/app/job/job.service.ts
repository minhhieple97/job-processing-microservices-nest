import { DiscoveryService } from '@golevelup/nestjs-discovery';
import { Injectable, OnModuleInit } from '@nestjs/common';
import { JOB_METADATA_KEY } from '../decorators';
import { DiscoveredMethodWithMeta } from '@golevelup/nestjs-discovery';
import { AbstractJob } from './abstract.job';
@Injectable()
export class JobService implements OnModuleInit {
  private jobs: DiscoveredMethodWithMeta<AbstractJob>[] = [];
  constructor(private readonly discoveryService: DiscoveryService) {}

  async onModuleInit() {
    this.jobs =
      await this.discoveryService.providerMethodsWithMetaAtKey<AbstractJob>(
        JOB_METADATA_KEY
      );
  }
}
