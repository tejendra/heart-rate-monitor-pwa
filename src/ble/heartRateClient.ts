import { isMockHeartRateEnabled } from './mockHeartRate';
import { MockHeartRateService } from './mockHeartRateService';
import { HeartRateService } from './heartRateService';

export const heartRateService = isMockHeartRateEnabled()
  ? new MockHeartRateService()
  : new HeartRateService();