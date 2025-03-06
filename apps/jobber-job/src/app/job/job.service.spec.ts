/* eslint-disable @typescript-eslint/no-explicit-any */
import { Test, TestingModule } from '@nestjs/testing';
import { DiscoveryService } from '@golevelup/nestjs-discovery';
import { JobService } from './job.service';
import { BadRequestException } from '@nestjs/common';
import { AbstractJob } from './abstract.job';
import { JOB_METADATA_KEY } from '../decorators';
import { Type } from '@nestjs/common';

class TestModule {}

class MockAbstractJob extends AbstractJob {
  // eslint-disable-next-line @typescript-eslint/no-empty-function
  async execute(): Promise<void> {}
}

class FailingMockJob extends AbstractJob {
  async execute(): Promise<void> {
    throw new Error('Job execution failed');
  }
}

describe('JobService', () => {
  let service: JobService;
  let discoveryService: DiscoveryService;

  const mockMethodsWithMeta = [
    {
      meta: { name: 'testMethod', description: 'Test Method' },
      discoveredMethod: {
        handler: jest.fn(),
        methodName: 'testHandler',
        parentClass: {
          instance: {},
          name: 'TestClass',
          parentModule: {
            name: 'TestModule',
            instance: {},
            metatype: TestModule as Type<any>,
          },
          injectType: 'injectable' as const,
          dependencyType: 'provider' as const,
        },
      },
    },
    {
      meta: { name: 'failingMethod', description: 'Failing Method' },
      discoveredMethod: {
        handler: jest
          .fn()
          .mockRejectedValue(new Error('Method execution failed')),
        methodName: 'failingHandler',
        parentClass: {
          instance: {},
          name: 'TestClass',
          parentModule: {
            name: 'TestModule',
            instance: {},
            metatype: TestModule as Type<any>,
          },
          injectType: 'injectable' as const,
          dependencyType: 'provider' as const,
        },
      },
    },
  ] as any;

  const mockClassesWithMeta = [
    {
      meta: { name: 'testClass', description: 'Test Class' },
      discoveredClass: {
        instance: new MockAbstractJob(),
        name: 'TestClass',
        parentModule: {
          name: 'TestModule',
          instance: {},
          metatype: TestModule as Type<any>,
        },
        injectType: 'injectable' as const,
        dependencyType: 'provider' as const,
      },
    },
    {
      meta: { name: 'failingClass', description: 'Failing Class' },
      discoveredClass: {
        instance: new FailingMockJob(),
        name: 'FailingClass',
        parentModule: {
          name: 'TestModule',
          instance: {},
          metatype: TestModule as Type<any>,
        },
        injectType: 'injectable' as const,
        dependencyType: 'provider' as const,
      },
    },
  ] as any;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        JobService,
        {
          provide: DiscoveryService,
          useValue: {
            providerMethodsWithMetaAtKey: jest.fn(),
            providersWithMetaAtKey: jest.fn(),
          },
        },
      ],
    }).compile();

    service = module.get<JobService>(JobService);
    discoveryService = module.get<DiscoveryService>(DiscoveryService);

    jest
      .spyOn(discoveryService, 'providerMethodsWithMetaAtKey')
      .mockResolvedValue(mockMethodsWithMeta);
    jest
      .spyOn(discoveryService, 'providersWithMetaAtKey')
      .mockResolvedValue(mockClassesWithMeta);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('onModuleInit', () => {
    it('should discover methods and classes with job metadata', async () => {
      await service.onModuleInit();

      expect(
        discoveryService.providerMethodsWithMetaAtKey
      ).toHaveBeenCalledWith(JOB_METADATA_KEY);
      expect(discoveryService.providersWithMetaAtKey).toHaveBeenCalledWith(
        JOB_METADATA_KEY
      );

      const jobs = (service as any).jobs;
      expect(jobs.length).toBe(4);

      expect(jobs[0]).toEqual(mockMethodsWithMeta[0]);
      expect(jobs[1]).toEqual(mockMethodsWithMeta[1]);

      expect(jobs[2].meta).toEqual(mockClassesWithMeta[0].meta);
      expect(jobs[2].discoveredMethod).toBeDefined();
      expect(jobs[2].discoveredMethod.methodName).toEqual('execute');
      expect(jobs[2].discoveredMethod.parentClass).toEqual(
        mockClassesWithMeta[0].discoveredClass
      );

      expect(jobs[3].meta).toEqual(mockClassesWithMeta[1].meta);
      expect(jobs[3].discoveredMethod).toBeDefined();
      expect(jobs[3].discoveredMethod.methodName).toEqual('execute');
      expect(jobs[3].discoveredMethod.parentClass).toEqual(
        mockClassesWithMeta[1].discoveredClass
      );
    });

    it('should handle empty responses from discovery service', async () => {
      jest
        .spyOn(discoveryService, 'providerMethodsWithMetaAtKey')
        .mockResolvedValue([]);
      jest
        .spyOn(discoveryService, 'providersWithMetaAtKey')
        .mockResolvedValue([]);

      await service.onModuleInit();

      const jobs = (service as any).jobs;
      expect(jobs).toEqual([]);
    });

    it('should handle errors from discovery service', async () => {
      jest
        .spyOn(discoveryService, 'providerMethodsWithMetaAtKey')
        .mockRejectedValue(new Error('Discovery failed'));

      await expect(service.onModuleInit()).rejects.toThrow('Discovery failed');
    });
  });

  describe('getJobsMetadata', () => {
    it('should return all job metadata', async () => {
      await service.onModuleInit();
      const metadata = service.getJobsMetadata();

      expect(metadata.length).toBe(4);

      expect(metadata[0]).toEqual(mockMethodsWithMeta[0].meta);
      expect(metadata[1]).toEqual(mockMethodsWithMeta[1].meta);
      expect(metadata[2]).toEqual(mockClassesWithMeta[0].meta);
      expect(metadata[3]).toEqual(mockClassesWithMeta[1].meta);
    });

    it('should return an empty array when no jobs are found', async () => {
      jest
        .spyOn(discoveryService, 'providerMethodsWithMetaAtKey')
        .mockResolvedValue([]);
      jest
        .spyOn(discoveryService, 'providersWithMetaAtKey')
        .mockResolvedValue([]);

      await service.onModuleInit();
      const metadata = service.getJobsMetadata();

      expect(metadata).toEqual([]);
    });
  });

  describe('executeJob', () => {
    beforeEach(async () => {
      await service.onModuleInit();
    });

    it('should execute a job by name from methods', async () => {
      const result = await service.executeJob('testMethod');

      expect(
        mockMethodsWithMeta[0].discoveredMethod.handler
      ).toHaveBeenCalled();
      expect(result).toEqual(mockMethodsWithMeta[0].meta);
    });

    it('should execute a job by name from classes', async () => {
      const executeSpy = jest.spyOn(
        mockClassesWithMeta[0].discoveredClass.instance as MockAbstractJob,
        'execute'
      );

      const result = await service.executeJob('testClass');

      expect(executeSpy).toHaveBeenCalled();
      expect(result).toEqual(mockClassesWithMeta[0].meta);
    });

    it('should throw BadRequestException if job is not found', async () => {
      await expect(service.executeJob('nonExistentJob')).rejects.toThrow(
        new BadRequestException('Job nonExistentJob not found')
      );
    });

    it('should propagate errors from method handlers', async () => {
      await expect(service.executeJob('failingMethod')).rejects.toThrow(
        'Method execution failed'
      );
    });

    it('should propagate errors from class handlers', async () => {
      await expect(service.executeJob('failingClass')).rejects.toThrow(
        'Job execution failed'
      );
    });

    it('should handle null or undefined job name', async () => {
      await expect(service.executeJob(null as any)).rejects.toThrow(
        BadRequestException
      );
      await expect(service.executeJob(undefined as any)).rejects.toThrow(
        BadRequestException
      );
    });

    it('should handle empty string job name', async () => {
      await expect(service.executeJob('')).rejects.toThrow(BadRequestException);
    });
  });
});
