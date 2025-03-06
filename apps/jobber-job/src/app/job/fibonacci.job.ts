import { Job } from '../decorators';
import { AbstractJob } from './abstract.job';

@Job({
  name: 'fibonacci',
  description: 'Generate Fibonacci sequence and store in database',
})
export class FibonacciJob extends AbstractJob {
  async execute() {
    console.log('FibonacciJob executed');
  }
}
