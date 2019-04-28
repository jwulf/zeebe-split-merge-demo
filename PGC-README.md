# Zeebe Data Processing Pipeline Demo

## Split-Join Fork Trial #1

```
ts-node split-join-1.ts
```

./bpmn/test-split-join-1.bpmn tries to create two data processing pipelines with different parameters and generate two different files.

On merge, I expect to get an array with two file names.

**Problem:** Parameters are stepped on as flows are not independent in a split. They share the global context while most modern languages enforce a limited scope. This is unexpected. I am wondering if this is the case for all BPMN engines or specific behavior to Zeebe.

## Split-Join Fork Trial #2

```
ts-node split-join-2.ts
```

./bpmn/test-split-join-2.bpmn creates two subprocesses to make the pipelines independent.

This does not work either. Parameters are still in global scope although running in different subprocesses.

**Problem:** This makes subprocesses questionable now.

## Split-Join Fork Trial #3

```
ts-node split-join-3.ts
```

./bpmn/test-split-join-3.bpmn forces the subprocesses to keep their parameters local using ioMapping.

It creates a dummy "local" variable.

In each subprocess, we use input mapping to map the parameters to "local".

This works to a point.

Parameters are now local but we have added input variables to each task (which is confusing). We have same variable names in variables and task configuration headers.

Each task can process a different file and each task returns a file name.

I created in each subprocess an output mapping to add the file to a "files" variable.
However, the file names does not get merged but replaced.

## Another approach: messaging from a distinct processing workflow

Another approach is to break out the file processing to its own workflow, with its own context.

A master workflow starts a new workflow for each file processing task, passing in the appropriate configuration.

Communication from the file processing workflow back to the master workflow is via message. When a file has been processed, it messages the result back to the master workflow, which aggregates the results.

This is illustrated in `bpmn/split-inputs.bpmn` (the master workflow) and `bpmn/do-processing.bpmn` (the file processing workflow).

This way, each file processing workflow can be started with its own configuration, and no opportunity to interact with other workflows.
