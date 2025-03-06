import { Mutation, Query, Resolver } from '@nestjs/graphql';
import { JobService } from './job.service';
import { JobMetadata } from './models/job-metadata.model';
import { Args } from '@nestjs/graphql';
import { ExecuteJobInput } from './dtos/excute-job.input';

@Resolver()
export class JobResolver {
  constructor(private readonly jobService: JobService) {}
  @Query(() => [JobMetadata])
  async getJobs() {
    return this.jobService.getJobsMetadata();
  }
  @Mutation(() => JobMetadata)
  async executeJob(@Args('input') input: ExecuteJobInput) {
    return this.jobService.executeJob(input.name);
  }
}
