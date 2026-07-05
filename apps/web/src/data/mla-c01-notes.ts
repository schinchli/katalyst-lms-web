/**
 * MLA-C01 domain notes — reading material for the ML Engineer Associate path.
 *
 * One module per official exam domain (weights from the exam guide):
 *   D1 Data Preparation (28%) · D2 Model Development (26%) ·
 *   D3 Deployment & Orchestration (22%) · D4 Monitoring, Maintenance & Security (24%)
 *
 * Grounded in the MLA-C01 study-guide corpus ingested into RAG (corpus 'mla-c01').
 */
import type { ModuleNotes } from './moduleNotes';

export const MLA_C01_NOTES: Record<string, ModuleNotes> = {
  'mla-d01': {
    moduleId: 'mla-d01',
    title: 'MLA D1: Data Preparation for ML',
    subtitle: 'Ingest, transform, and validate data — 28% of the exam',
    readingMinutes: 14,
    intro: 'Data preparation carries the biggest weight on the MLA-C01 exam. This module covers how data gets into AWS, how it is stored and transformed for training, and how you guarantee its quality, fairness, and security before a model ever sees it.',
    sections: [
      {
        heading: 'Data formats and ingestion',
        body: 'ML workloads on AWS revolve around a handful of formats. Columnar formats (Parquet, ORC) dominate analytics and training because they compress well and let engines read only needed columns. Row formats (CSV, JSON, Avro) suit streaming and interchange, while RecordIO-protobuf is SageMaker\'s optimized format for Pipe-mode training.\n\nIngestion is either batch or streaming. Batch data lands in Amazon S3 via AWS Glue jobs, AWS DMS (from databases), or AWS DataSync (from on-premises file systems). Streaming data flows through Amazon Kinesis Data Streams (custom consumers, replay), Amazon Data Firehose (fully managed delivery to S3/Redshift with buffering and format conversion to Parquet), or Amazon MSK when Kafka compatibility matters.',
        keyPoints: [
          'Parquet/ORC = columnar, compressed, best for training and Athena queries',
          'Firehose = zero-admin delivery to S3 with built-in Parquet conversion; Kinesis Data Streams = replayable, custom consumers',
          'DMS migrates/replicates databases; DataSync moves file data; Glue runs serverless ETL',
          'SageMaker Pipe mode streams RecordIO from S3 — faster start, no local disk copy',
        ],
      },
      {
        heading: 'Storage for training: S3, EFS, FSx for Lustre',
        body: 'Amazon S3 is the default home for datasets and the only storage SageMaker training reads natively in File and Pipe modes. When training needs a POSIX file system — huge datasets, many small files, or repeated epochs — mount Amazon FSx for Lustre, which links to an S3 bucket and delivers sub-millisecond, massively parallel throughput. Amazon EFS suits shared notebooks and moderate-throughput workloads.\n\nChoose by access pattern: S3 for durable, cheap object storage and one-pass reads; FSx for Lustre when GPU clusters would otherwise sit idle waiting on I/O; EFS for shared, elastic file access across instances.',
        keyPoints: [
          'S3 = default dataset store; lifecycle policies tier old data to Glacier',
          'FSx for Lustre = high-throughput POSIX layer over S3 for large distributed training',
          'EFS = shared elastic NFS for notebooks and lighter training I/O',
          'Fast file mode gives File-mode simplicity with Pipe-mode-like start times',
        ],
      },
      {
        heading: 'Transformation and feature engineering',
        body: 'Feature engineering turns raw columns into signals a model can learn from. Numeric features get scaled (standardization, min-max), skewed features get log transforms, and continuous values can be binned. Categorical features are encoded: one-hot for low cardinality, label/ordinal when order matters, and binary or embeddings for high cardinality. Text is tokenized before vectorization.\n\nSageMaker Data Wrangler covers visual exploration and 300+ built-in transforms and exports directly to pipelines or Feature Store. AWS Glue DataBrew offers a similar no-code experience for analysts. Heavier or scheduled transforms run in AWS Glue (Spark), Amazon EMR (managed Spark/Hadoop for the largest jobs), or AWS Lambda for lightweight real-time record transforms. SageMaker Feature Store then keeps online (low-latency serving) and offline (training) copies of curated features consistent.',
        keyPoints: [
          'One-hot = few categories; label encoding = ordinal; embeddings/binary = high cardinality',
          'Log transform tames right-skewed features; scaling is mandatory for distance-based models',
          'Data Wrangler = visual prep inside SageMaker; DataBrew = no-code prep in Glue',
          'Feature Store keeps online + offline features in sync and versioned',
        ],
      },
      {
        heading: 'Labeling and data integrity',
        body: 'Supervised models need labels. SageMaker Ground Truth manages labeling workflows with human workforces (private teams, vendors, or Amazon Mechanical Turk) and cuts cost with automated data labeling, where a model labels easy examples and humans handle the rest.\n\nBefore training, validate quality and fairness. AWS Glue Data Quality rules catch nulls, ranges, and schema drift. SageMaker Clarify computes pre-training bias metrics — Class Imbalance (CI) and Difference in Proportions of Labels (DPL) — so skew in the dataset is visible before it becomes skew in predictions. Address imbalance with resampling (SMOTE, under/over-sampling) or class weights, and mitigate selection and measurement bias at the source.',
        keyPoints: [
          'Ground Truth = managed labeling with active-learning cost reduction',
          'Clarify pre-training metrics: CI (class imbalance) and DPL (label proportion gaps)',
          'Glue Data Quality automates rule-based validation in pipelines',
          'Fix imbalance with SMOTE/resampling or class weights before blaming the model',
        ],
      },
      {
        heading: 'Protecting data: encryption, PII, and compliance',
        body: 'Everything at rest is encrypted with AWS KMS keys — S3 buckets, EBS volumes attached to training instances, Feature Store, and model artifacts. In transit, TLS covers API calls, and inter-node distributed-training traffic can be encrypted (at a throughput cost).\n\nSensitive data needs classification first: Amazon Macie discovers PII in S3 automatically, Glue/Comprehend can detect and redact PII fields, and masking, tokenization, or anonymization keep identifiers out of training sets. Data residency requirements pin datasets and training jobs to specific Regions — a recurring exam scenario for regulated industries handling PII and PHI.',
        keyPoints: [
          'KMS everywhere: S3, training volumes, model artifacts, Feature Store',
          'Macie = automated PII discovery in S3; Comprehend can redact PII in text',
          'Inter-node encryption for distributed training exists but slows throughput',
          'Data residency = keep data and jobs in-Region; know this for PHI scenarios',
        ],
      },
    ],
    examTips: [
      'Expect format questions: pick Parquet for analytics/training cost, RecordIO+Pipe mode for fast training start.',
      'Firehose vs Kinesis Data Streams: "no code, deliver to S3" → Firehose; "replay, custom consumers, ordering" → Data Streams.',
      'GPU idle during training on millions of small files → FSx for Lustre is almost always the answer.',
      'Bias before training = Clarify CI/DPL; imbalanced classes = SMOTE or class weights, never just accuracy.',
      'PII in S3 at scale → Macie discovers; masking/tokenization prepares it for training.',
    ],
  },

  'mla-d02': {
    moduleId: 'mla-d02',
    title: 'MLA D2: ML Model Development',
    subtitle: 'Choose, train, tune, and evaluate models — 26% of the exam',
    readingMinutes: 14,
    intro: 'Domain 2 tests whether you can pick the right modeling approach (buy vs build), train and tune efficiently on SageMaker, and read evaluation metrics honestly — including when the model is overfitting or unfair.',
    sections: [
      {
        heading: 'Choosing an approach: AI services vs SageMaker',
        body: 'The cheapest model is one you don\'t train. Pre-trained AI services solve common problems out of the box: Amazon Rekognition (images/video), Transcribe (speech-to-text), Translate, Comprehend (NLP/sentiment/PII), Textract (documents), Lex (bots), and Amazon Bedrock for foundation-model text and image generation with RAG and agents.\n\nWhen you need a custom model, SageMaker offers a ladder of effort: Autopilot (AutoML — it explores candidates and produces a leaderboard plus explainability), JumpStart (pre-trained models and solution templates you fine-tune), built-in algorithms (no training code, just hyperparameters), and finally bring-your-own script or container for full control. Interpretability also drives selection — linear models and trees explain themselves; deep networks need SHAP via SageMaker Clarify.',
        keyPoints: [
          'Business problem matches an AI service → use it; custom data/logic → SageMaker',
          'Autopilot = AutoML with leaderboard + notebooks; JumpStart = fine-tune pre-trained models',
          'Effort ladder: AI service → Autopilot → JumpStart → built-in algo → custom container',
          'Need explainability for regulators → simpler models or Clarify SHAP',
        ],
      },
      {
        heading: 'SageMaker built-in algorithms',
        body: 'Built-in algorithms are containerized, hyperparameter-driven, and tuned for AWS hardware. The ones the exam loves: XGBoost (tabular classification/regression — the default answer for structured data), Linear Learner (linear/logistic regression at scale), K-Means (clustering), PCA (dimensionality reduction), DeepAR (probabilistic time-series forecasting across many related series), BlazingText (Word2Vec + fast text classification), Image Classification and Object Detection (vision), and Random Cut Forest (anomaly detection).\n\nKnow the input channels each expects (most read RecordIO or CSV from S3) and that built-ins support Spot training, checkpointing, and distributed training without custom code.',
        keyPoints: [
          'Tabular data, best accuracy fast → XGBoost',
          'Forecasting many related time series → DeepAR',
          'Anomaly detection on streams → Random Cut Forest',
          'Text embeddings/classification → BlazingText; dimensionality reduction → PCA',
        ],
      },
      {
        heading: 'Training at scale: instances, Spot, and parallelism',
        body: 'Training jobs run on ephemeral clusters: GPU families (P for training, G for cost-effective training/inference) and AWS silicon (Trainium via trn1 for training, Inferentia via inf2 for inference) trade cost against speed. Managed Spot Training cuts training cost up to ~90% — pair it with checkpointing to S3 so interrupted jobs resume instead of restarting.\n\nWhen a model or dataset outgrows one device, SageMaker distributed training offers data parallelism (each GPU gets a shard of every batch) and model parallelism (the model itself is split across devices). SageMaker Debugger watches tensors during training and can stop wasteful jobs on rules like vanishing gradients or overfitting.',
        keyPoints: [
          'Spot training + checkpoints = the exam\'s favorite cost answer for interruptible training',
          'Data parallel = big dataset; model parallel = model too large for one GPU',
          'Trainium (trn1) = cost-efficient training; Inferentia (inf2) = cost-efficient inference',
          'Debugger rules catch vanishing gradients, overfitting, and idle GPUs automatically',
        ],
      },
      {
        heading: 'Hyperparameter tuning and regularization',
        body: 'SageMaker Automatic Model Tuning (AMT) searches hyperparameter space with random search, Bayesian optimization (learns from earlier trials — usually fewest jobs to a good result), grid search, or Hyperband (early-stops weak trials — best when training is expensive). Warm start reuses knowledge from previous tuning jobs.\n\nTo fight overfitting: L1 regularization (drives weights to zero, doubles as feature selection), L2 (shrinks weights smoothly), dropout for neural networks, early stopping on validation loss, and more/augmented data. Underfitting calls for the opposite — more capacity, more features, less regularization.',
        keyPoints: [
          'Bayesian = efficient search; Hyperband = kills bad trials early; grid = exhaustive/expensive',
          'Train accuracy high + validation low = overfitting → regularize, drop out, stop early',
          'Both low = underfitting → bigger model, better features, train longer',
          'L1 = sparse weights/feature selection; L2 = smooth shrinkage',
        ],
      },
      {
        heading: 'Evaluating performance honestly',
        body: 'Classification metrics come from the confusion matrix: precision (of predicted positives, how many are right — optimize when false positives are costly), recall (of actual positives, how many were found — optimize when misses are costly, e.g. fraud or disease), F1 (harmonic mean when classes are imbalanced), and AUC-ROC (threshold-independent ranking quality). Accuracy alone lies on imbalanced data. Regression uses RMSE (punishes large errors), MAE (robust to outliers), and R².\n\nSageMaker Experiments tracks runs, parameters, and metrics for comparison; Clarify computes post-training bias metrics and SHAP feature attributions so you can explain individual predictions; Model Registry versions the winner for deployment.',
        keyPoints: [
          'Costly false negatives (fraud, cancer) → recall; costly false positives (spam) → precision',
          'Imbalanced classes → F1/AUC, never raw accuracy',
          'RMSE punishes big misses; MAE tolerates outliers',
          'Experiments = run tracking; Clarify SHAP = per-prediction explainability',
        ],
      },
    ],
    examTips: [
      'Read the business cost of an error first — it decides precision vs recall every time.',
      '"No ML expertise, tabular data" → Autopilot. "Fine-tune a pre-trained model fast" → JumpStart.',
      'Reduce training cost with Spot + checkpointing before considering smaller instances.',
      'Bayesian optimization is the default AMT answer; Hyperband when trials are long and expensive.',
      'Explainability question → SageMaker Clarify (SHAP); run tracking → SageMaker Experiments.',
    ],
  },

  'mla-d03': {
    moduleId: 'mla-d03',
    title: 'MLA D3: Deployment & Orchestration',
    subtitle: 'Serve models and automate ML pipelines — 22% of the exam',
    readingMinutes: 12,
    intro: 'Domain 3 covers turning a trained artifact into a production service: choosing the right inference option, packaging containers, scripting infrastructure, and wiring CI/CD so retraining and redeployment run themselves.',
    sections: [
      {
        heading: 'Choosing inference infrastructure',
        body: 'SageMaker offers four inference options and the exam tests the boundaries between them. Real-time endpoints serve synchronous, low-latency traffic on always-on instances. Serverless Inference auto-scales to zero — ideal for intermittent traffic with tolerable cold starts. Asynchronous Inference queues requests with large payloads (up to 1 GB) or long processing times and scales to zero between bursts. Batch Transform processes whole datasets offline with no persistent endpoint at all.\n\nDensity optimizations matter for cost: multi-model endpoints host thousands of models behind one endpoint loading them on demand; multi-container endpoints host different frameworks side by side. Inference Recommender load-tests instance types for you, and SageMaker Neo compiles models for edge targets.',
        keyPoints: [
          'Real-time = steady low-latency; Serverless = spiky/intermittent; Async = big payloads/long jobs; Batch = no endpoint needed',
          'Multi-model endpoint = thousands of per-tenant models on shared instances',
          'Inference Recommender picks instance types with real load tests',
          'Auto scaling on endpoints tracks InvocationsPerInstance',
        ],
      },
      {
        heading: 'Containers and infrastructure as code',
        body: 'Every SageMaker job and endpoint runs a container from Amazon ECR — AWS-provided framework images, extended images, or fully custom (BYOC) when you need exotic dependencies. Models can also deploy to ECS/EKS when the organization already standardizes on Kubernetes.\n\nInfrastructure is scripted, not clicked: AWS CloudFormation templates or AWS CDK apps declare endpoints, pipelines, and roles so environments are reproducible across dev/test/prod accounts. SageMaker Projects packages this as templates that stamp out a full MLOps setup — repos, pipelines, and deployment stages — per model.',
        keyPoints: [
          'ECR hosts every training/inference image; BYOC for custom stacks',
          'CloudFormation/CDK make ML infra reproducible and reviewable',
          'SageMaker Projects = ready-made MLOps template per model',
          'EKS/ECS deployment is valid when the org is Kubernetes-first',
        ],
      },
      {
        heading: 'Orchestration: Pipelines, Step Functions, MWAA',
        body: 'SageMaker Pipelines is the ML-native orchestrator: DAGs of processing, training, tuning, evaluation, and conditional registration steps, with lineage tracking and a Model Registry that gates deployment behind approval status. Step Functions orchestrates broader serverless workflows that mix ML steps with Lambda, Glue, and human approvals. Amazon MWAA (managed Airflow) fits teams already invested in Airflow DAGs.\n\nA canonical pipeline: preprocess (Processing job) → train → evaluate → condition (metric threshold) → register model → deploy on approval. EventBridge can trigger the whole thing on schedule or on new data arriving in S3.',
        keyPoints: [
          'SageMaker Pipelines = ML-native DAG + lineage + Model Registry integration',
          'Step Functions = general serverless orchestration across AWS services',
          'MWAA = managed Apache Airflow for existing Airflow shops',
          'Model Registry approval status is the deployment gate',
        ],
      },
      {
        heading: 'CI/CD and safe deployment strategies',
        body: 'CodePipeline ties it together: source (Git) → CodeBuild (build containers, run tests) → deploy stages. Retraining pipelines fire from EventBridge on data drift alarms or schedules.\n\nEndpoint updates never need downtime: blue/green deployment shifts traffic between fleets — all-at-once, canary (small slice first, watch alarms, then shift), or linear (stepped percentages). Shadow tests send production traffic copies to a challenger variant without affecting responses, and production variants split live traffic for A/B tests. CloudWatch alarms wired to the deployment roll back automatically on errors.',
        keyPoints: [
          'Canary/linear traffic shifting with alarm-based auto-rollback = safe updates',
          'Shadow variant = evaluate challenger on real traffic, zero user impact',
          'Production variants = A/B testing with weighted traffic splits',
          'EventBridge triggers retraining pipelines from drift alarms or schedules',
        ],
      },
      {
        heading: 'Fine-tuning and deploying foundation models',
        body: 'The exam expects working knowledge of foundation-model operations: fine-tuning pre-trained models from JumpStart or Amazon Bedrock (custom models train on your data privately), parameter-efficient techniques (LoRA-style adapters cut cost versus full fine-tuning), and Retrieval-Augmented Generation as the cheaper alternative when knowledge, not behavior, is the gap.\n\nServing large models leans on the specialized SageMaker LMI (large model inference) containers, model parallelism across GPUs, and quantization to fit memory budgets.',
        keyPoints: [
          'Behavior change → fine-tune; knowledge gap → RAG first (cheaper)',
          'Bedrock custom models = managed fine-tuning without infrastructure',
          'Parameter-efficient fine-tuning (adapters/LoRA) slashes cost vs full FT',
          'Large-model serving: LMI containers, tensor parallelism, quantization',
        ],
      },
    ],
    examTips: [
      'Match inference type to traffic shape: intermittent → Serverless, huge payload → Async, nightly scoring → Batch Transform.',
      'Thousands of similar per-customer models → multi-model endpoint, not thousands of endpoints.',
      '"Test new model on live traffic without user impact" → shadow variant.',
      'ML-only workflow → SageMaker Pipelines; workflow mixing Lambda/Glue/approvals → Step Functions.',
      'Zero-downtime endpoint update with auto-rollback → blue/green canary + CloudWatch alarms.',
    ],
  },

  'mla-d04': {
    moduleId: 'mla-d04',
    title: 'MLA D4: Monitoring, Maintenance & Security',
    subtitle: 'Keep models healthy, cheap, and locked down — 24% of the exam',
    readingMinutes: 12,
    intro: 'Models decay and clusters cost money. Domain 4 covers detecting drift with Model Monitor, watching infrastructure and spend, and securing every layer of the ML stack with IAM, VPC isolation, and KMS.',
    sections: [
      {
        heading: 'Monitoring model inference with Model Monitor',
        body: 'SageMaker Model Monitor runs scheduled analyses against captured endpoint traffic (Data Capture stores requests/responses in S3) and compares them to a baseline computed from the training set. Its four monitor types map directly to exam scenarios: data quality (input distribution drift), model quality (accuracy decay — needs ground-truth labels joined later), bias drift (fairness metrics moving after deployment), and feature attribution drift (SHAP importance shifting, via Clarify).\n\nViolations publish CloudWatch metrics; alarms feed EventBridge, which can page on-call or trigger the retraining pipeline automatically — closing the MLOps loop.',
        keyPoints: [
          'Enable Data Capture on the endpoint first — everything else builds on it',
          'Data quality = input drift; model quality = accuracy decay (needs labels)',
          'Bias drift + feature attribution drift come from Clarify integration',
          'Violations → CloudWatch alarm → EventBridge → retrain pipeline',
        ],
      },
      {
        heading: 'Infrastructure observability',
        body: 'CloudWatch collects endpoint metrics out of the box: Invocations, ModelLatency, OverheadLatency, 4XX/5XX errors, and per-instance CPU/GPU/memory utilization. Training jobs emit logs and metrics to CloudWatch Logs; algorithm metrics (loss, accuracy) can be charted live. CloudTrail records every SageMaker API call for audit — who created which endpoint, who accessed which model.\n\nFor deeper visibility: SageMaker Debugger profiles GPU utilization during training, and AWS X-Ray traces the application path in front of the endpoint.',
        keyPoints: [
          'ModelLatency vs OverheadLatency separates model time from SageMaker plumbing',
          'GPU underutilization in training → Debugger profiler finds the bottleneck',
          'CloudTrail = audit log of every SageMaker API action',
          'Set alarms on Invocations + latency to drive auto scaling and rollbacks',
        ],
      },
      {
        heading: 'Cost optimization for ML workloads',
        body: 'Training savings: Managed Spot Training with checkpointing, right-sized instances validated by short profiling runs, Trainium (trn1) for supported frameworks, and stopping idle Studio notebooks (lifecycle configurations automate this). Inference savings: Serverless or Async endpoints for spiky traffic, multi-model endpoints for fleets of small models, Inferentia (inf2) or Graviton instances, auto scaling down at night, and SageMaker Savings Plans for steady baseline usage.\n\nTag everything (project, team, environment) and slice spend in Cost Explorer; AWS Budgets alarms catch runaway training jobs before the invoice does.',
        keyPoints: [
          'Spot + checkpointing ≈ up to 90% off training; Savings Plans for steady inference',
          'Idle notebooks are a classic leak — lifecycle configs auto-stop them',
          'Inferentia/Graviton cut inference $/req; Serverless scales to zero',
          'Tags + Cost Explorer + Budgets = ML cost governance',
        ],
      },
      {
        heading: 'Securing the ML stack',
        body: 'IAM does the heavy lifting: the SageMaker execution role scopes what jobs and endpoints can touch (least privilege — specific buckets, specific KMS keys), and SageMaker Role Manager generates purpose-built roles for data scientists vs MLOps engineers. Resource policies and condition keys restrict who can invoke endpoints.\n\nNetwork isolation puts training jobs and endpoints inside your VPC with no internet route; S3 access flows through VPC endpoints (PrivateLink), and inter-node training traffic can be encrypted. Enable network isolation mode to block containers from any outbound calls. KMS encrypts notebooks, training volumes, model artifacts, and endpoints; Secrets Manager holds any credentials pipelines need. Macie, GuardDuty, and Security Hub extend the account-level posture over ML data.',
        keyPoints: [
          'Execution role least-privilege + Role Manager persona roles',
          'VPC mode + S3 VPC endpoints + network isolation = no data exfiltration path',
          'KMS keys on every artifact: volumes, models, endpoints, Feature Store',
          'Secrets Manager for pipeline credentials — never hardcode in containers',
        ],
      },
    ],
    examTips: [
      'Drift question? Name the monitor: inputs changed = data quality; accuracy fell = model quality; fairness moved = bias drift.',
      'Auto-retrain on drift = Model Monitor → CloudWatch alarm → EventBridge → SageMaker Pipeline.',
      '"Training data must never traverse the internet" → VPC mode + S3 VPC endpoint + network isolation.',
      'Cost questions reward managed answers: Spot training, Serverless Inference, multi-model endpoints, auto-stop notebooks.',
      'Audit "who deployed this model" → CloudTrail, not CloudWatch.',
    ],
  },
};
