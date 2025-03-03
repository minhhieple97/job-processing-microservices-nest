import { Module } from '@nestjs/common';
import { DiscoveryModule } from '@golevelup/nestjs-discovery';
import { FibonacciJob } from './fibonacci.job';
import { JobResolver } from './job.resolver';
import { JobService } from './job.service';
@Module({
  imports: [DiscoveryModule],
  providers: [FibonacciJob, JobResolver, JobService],
})
export class JobModule {}
