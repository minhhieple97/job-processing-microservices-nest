import { GrpcAuthGuard } from '@jobber/nestjs';
import { Mutation, Query, Resolver } from '@nestjs/graphql';
import { JobService } from './job.service';
import { JobMetadata } from './models/job-metadata.model';
import { Args } from '@nestjs/graphql';
import { ExecuteJobInput } from './dtos/excute-job.input';

import { UseGuards } from '@nestjs/common';

@Resolver('Job')
export class JobResolver {
  constructor(private readonly jobService: JobService) {}

  @Query(() => [JobMetadata])
  @UseGuards(GrpcAuthGuard)
  async getJobs() {
    console.log('OK');
    return this.jobService.getJobsMetadata();
  }

  @Mutation(() => JobMetadata)
  async executeJob(@Args('input') input: ExecuteJobInput) {
    return this.jobService.executeJob(input.name);
  }
}
