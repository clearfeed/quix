import { Test, TestingModule } from '@nestjs/testing';
import { LlmService } from './llm.service';
import { createTrajectoryMatchEvaluator } from 'agentevals';

describe('LlmService', () => {
  let service: LlmService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [LlmService]
    }).compile();

    service = module.get<LlmService>(LlmService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
    
  });

  it('test jira tool',async ()=>{
    expect(true).toBe(true);

    const evaluator= createTrajectoryMatchEvaluator({
      trajectoryMatchMode:'strict',
    toolArgsMatchMode:'exact',
  })

  const result = await evaluator({
    outputs: [...],
    referenceOutputs: [...],
  });

  expect(result.score).toBe(true);
});
