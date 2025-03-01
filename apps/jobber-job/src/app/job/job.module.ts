import { Module } from '@nestjs/common';
import { DiscoveryModule } from '@golevelup/nestjs-discovery';
import { FibonacciJob } from './fibonacci.job';

@Module({
  imports: [DiscoveryModule],
  providers: [FibonacciJob],
})
export class JobModule {}
