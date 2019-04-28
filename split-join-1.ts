import { BpmnParser, ZBClient } from "zeebe-node-0.17a";
const zbc = new ZBClient("localhost:26500");

test("./bpmn/test-split-join-1.bpmn");

export async function test(bpmnFile: string) {
  const processId = await deployWorkflow(bpmnFile);
  if (createWorkers()) {
    await zbc.createWorkflowInstance(processId, {});
  }
}

async function deployWorkflow(bpmnFile: string) {
  await zbc.deployWorkflow(bpmnFile, { redeploy: true });

  // Parse the process id from the bpmn file
  const pid: string = (BpmnParser.parseBpmn(bpmnFile) as any)[0][
    "bpmn:definitions"
  ]["bpmn:process"]["attr"]["@_id"];
  return pid;
}

function createWorkers() {
  const worker = zbc.createWorker(
    "config-to-payload-worker",
    "config-to-payload",

    (job, complete) => {
      const taskName = job.jobHeaders.elementId;
      console.log(
        '%s" input: %j output: %j',
        taskName,
        job.variables,
        job.customHeaders
      );
      complete(job.customHeaders);
    }
  );

  const outputWorker = zbc.createWorker(
    "output-worker",
    "output",
    (job, complete) => {
      const taskName = job.jobHeaders.elementId;
      console.log("%s: %j", taskName, job.variables);
      complete(job.variables);
    }
  );

  return { worker, outputWorker };
}
