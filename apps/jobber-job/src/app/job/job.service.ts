import { DiscoveryService } from '@golevelup/nestjs-discovery';
import { Injectable, BadRequestException, OnModuleInit } from '@nestjs/common';
import { JOB_METADATA_KEY } from '../decorators';
import { DiscoveredMethodWithMeta } from '@golevelup/nestjs-discovery';
import { JobMetadata } from './models/job-metadata.model';
import { AbstractJob } from './abstract.job';
@Injectable()
export class JobService implements OnModuleInit {
  private jobs: DiscoveredMethodWithMeta<JobMetadata>[] = [];
  constructor(private readonly discoveryService: DiscoveryService) {}

  async onModuleInit() {
    const methodsWithMeta =
      await this.discoveryService.providerMethodsWithMetaAtKey<JobMetadata>(
        JOB_METADATA_KEY
      );

    const classesWithMeta =
      await this.discoveryService.providersWithMetaAtKey<JobMetadata>(
        JOB_METADATA_KEY
      );

    const jobsFromClasses = classesWithMeta.map((provider) => {
      return {
        meta: provider.meta,
        discoveredMethod: {
          handler: () =>
            (provider.discoveredClass.instance as AbstractJob).execute(),
          methodName: 'execute',
          parentClass: provider.discoveredClass,
        },
      };
    });

    this.jobs = [...methodsWithMeta, ...jobsFromClasses];
  }
  getJobsMetadata() {
    return this.jobs.map((job) => job.meta);
  }
  async executeJob(name: string) {
    const job = this.jobs.find((job) => job.meta.name === name);
    if (!job) {
      throw new BadRequestException(`Job ${name} not found`);
    }
    await job.discoveredMethod.handler();
    return job.meta;
  }
}
