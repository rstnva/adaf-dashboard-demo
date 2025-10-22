import cron from 'node-cron';

export type IngestJob = () => Promise<void>;

export interface OracleSchedulerOptions {
  cronExpression?: string;
}

export class OracleIngestScheduler {
  private task: cron.ScheduledTask | null = null;
  private readonly job: IngestJob;
  private readonly options: Required<OracleSchedulerOptions>;

  constructor(job: IngestJob, options: OracleSchedulerOptions = {}) {
    this.job = job;
    this.options = {
      cronExpression: options.cronExpression ?? '*/1 * * * *',
    };
  }

  start() {
    if (this.task) {
      return;
    }

    this.task = cron.schedule(this.options.cronExpression, () => {
      void this.job().catch(error => {
        console.error('oracle-core: ingest job failed', error);
      });
    });
  }

  stop() {
    if (!this.task) {
      return;
    }

    this.task.stop();
    this.task = null;
  }
}
