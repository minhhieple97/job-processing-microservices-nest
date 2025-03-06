import { Test, TestingModule } from '@nestjs/testing';
import { JobResolver } from './job.resolver';
import { JobService } from './job.service';
import { ExecuteJobInput } from './dtos/excute-job.input';
import { BadRequestException } from '@nestjs/common';

describe('JobResolver', () => {
  let resolver: JobResolver;
  let jobService: JobService;

  const mockJobMetadata = [
    { name: 'job1', description: 'First job' },
    { name: 'job2', description: 'Second job' },
  ];

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        JobResolver,
        {
          provide: JobService,
          useValue: {
            getJobsMetadata: jest.fn(),
            executeJob: jest.fn(),
          },
        },
      ],
    }).compile();

    resolver = module.get<JobResolver>(JobResolver);
    jobService = module.get<JobService>(JobService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(resolver).toBeDefined();
  });

  describe('getJobs', () => {
    it('should return an array of job metadata', async () => {
      jest
        .spyOn(jobService, 'getJobsMetadata')
        .mockReturnValue(mockJobMetadata);

      const result = await resolver.getJobs();

      expect(jobService.getJobsMetadata).toHaveBeenCalled();
      expect(result).toEqual(mockJobMetadata);
    });

    it('should return an empty array when no jobs are found', async () => {
      jest.spyOn(jobService, 'getJobsMetadata').mockReturnValue([]);

      const result = await resolver.getJobs();

      expect(result).toEqual([]);
    });

    it('should handle errors from service', async () => {
      jest.spyOn(jobService, 'getJobsMetadata').mockImplementation(() => {
        throw new Error('Failed to get jobs');
      });

      await expect(resolver.getJobs()).rejects.toThrow('Failed to get jobs');
    });
  });

  describe('executeJob', () => {
    it('should execute a job and return its metadata', async () => {
      const input: ExecuteJobInput = { name: 'job1' };
      const expectedMetadata = mockJobMetadata[0];

      jest.spyOn(jobService, 'executeJob').mockResolvedValue(expectedMetadata);

      const result = await resolver.executeJob(input);

      expect(jobService.executeJob).toHaveBeenCalledWith(input.name);
      expect(result).toEqual(expectedMetadata);
    });

    it('should handle BadRequestException from service', async () => {
      const input: ExecuteJobInput = { name: 'nonExistentJob' };

      jest
        .spyOn(jobService, 'executeJob')
        .mockRejectedValue(
          new BadRequestException('Job nonExistentJob not found')
        );

      await expect(resolver.executeJob(input)).rejects.toThrow(
        BadRequestException
      );
      expect(jobService.executeJob).toHaveBeenCalledWith(input.name);
    });

    it('should handle job execution errors', async () => {
      const input: ExecuteJobInput = { name: 'failingJob' };

      jest
        .spyOn(jobService, 'executeJob')
        .mockRejectedValue(new Error('Job execution failed'));

      await expect(resolver.executeJob(input)).rejects.toThrow(
        'Job execution failed'
      );
      expect(jobService.executeJob).toHaveBeenCalledWith(input.name);
    });

    it('should handle empty job name', async () => {
      const input: ExecuteJobInput = { name: '' };

      jest
        .spyOn(jobService, 'executeJob')
        .mockRejectedValue(new BadRequestException('Job  not found'));

      await expect(resolver.executeJob(input)).rejects.toThrow(
        BadRequestException
      );
    });

    it('should pass through the name without modification', async () => {
      const input: ExecuteJobInput = { name: 'Job-With-Special_Chars!' };

      jest.spyOn(jobService, 'executeJob').mockResolvedValue({
        name: 'Job-With-Special_Chars!',
        description: 'Test job',
      });

      await resolver.executeJob(input);

      expect(jobService.executeJob).toHaveBeenCalledWith(
        'Job-With-Special_Chars!'
      );
    });
  });
});
