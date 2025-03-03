import { DiscoveryService } from '@golevelup/nestjs-discovery';
import { Injectable, OnModuleInit } from '@nestjs/common';
import { JOB_METADATA_KEY } from '../decorators';
import { DiscoveredMethodWithMeta } from '@golevelup/nestjs-discovery';
import { AbstractJob } from './abstract.job';
import { ExecuteJobInput } from './dtos/excute-job.input';
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
  getJobsMetadata() {
    return this.jobs.map((job) => job.meta);
  }
  executeJob(input: ExecuteJobInput) {
    const job = this.jobs.find((job) => job.meta.name === input.name);
    if (!job) {
      throw new Error(`Job ${input.name} not found`);
    }
    return job.execute();
  }
}
