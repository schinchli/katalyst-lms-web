import type { Question } from '@/types';

// ═══════════════════════════════════════════════════════════════
// EKS Course (200-COREKS) — Quiz Questions
// Generated from PPTX slides via scripts/generate_and_ingest.py
// M02–M09: run `python3 scripts/generate_and_ingest.py --from-corpus --module XX --types quiz`
//          after adding ANTHROPIC_API_KEY to learnk8s/.env.local
// ═══════════════════════════════════════════════════════════════

// ── Module 01: K8s Fundamentals ────────────────────────
export const eksCoreksM01Questions: Question[] = [
  {
    id: 'eks-coreks-m01-which-container-property-ensures-the-sam',
    text: `Which container property ensures the same image runs in dev, staging, and production environments?`,
    options: [
      { id: 'a', text: `Portable` },
      { id: 'b', text: `Scalable` },
      { id: 'c', text: `Continuously deployable` },
      { id: 'd', text: `Declarative` },
    ],
    correctOptionId: 'c',
    explanation: `The continuous deployment property guarantees the container image is identical across all environments, eliminating environment drift.`,
    difficulty: 'intermediate',
    category: 'eks-coreks',
    quizId: 'eks-coreks-m01',
  },
  {
    id: 'eks-coreks-m01-what-does-it-mean-that-containers-use-a',
    text: `What does it mean that containers use a declarative format?`,
    options: [
      { id: 'a', text: `You write step-by-step instructions for how to build the container` },
      { id: 'b', text: `You describe the desired result and let the system figure out how to achieve it` },
      { id: 'c', text: `You declare which programming language the app uses` },
      { id: 'd', text: `You specify the exact order of container startup` },
    ],
    correctOptionId: 'b',
    explanation: `Declarative means you describe WHAT you want (e.g., 3 replicas of nginx), not HOW to get there. Kubernetes reconciles the actual state to match.`,
    difficulty: 'intermediate',
    category: 'eks-coreks',
    quizId: 'eks-coreks-m01',
  },
  {
    id: 'eks-coreks-m01-at-what-point-do-containers-require-orch',
    text: `At what point do containers require orchestration tools like Kubernetes?`,
    options: [
      { id: 'a', text: `When running more than 1 container` },
      { id: 'b', text: `Only when using Docker Compose` },
      { id: 'c', text: `When managing hundreds of hosts with thousands of containers` },
      { id: 'd', text: `Orchestration is always optional` },
    ],
    correctOptionId: 'c',
    explanation: `1-2 containers on one host is trivial. Once you scale to hundreds of hosts with thousands of containers, manual scheduling, networking, and health management is impossible without orchestration.`,
    difficulty: 'intermediate',
    category: 'eks-coreks',
    quizId: 'eks-coreks-m01',
  },
  {
    id: 'eks-coreks-m01-what-is-the-basic-unit-of-scaling-and-re',
    text: `What is the basic unit of scaling and resiliency in Kubernetes?`,
    options: [
      { id: 'a', text: `Container` },
      { id: 'b', text: `Pod` },
      { id: 'c', text: `Deployment` },
      { id: 'd', text: `Node` },
    ],
    correctOptionId: 'b',
    explanation: `A Pod is the smallest deployable unit. It can contain one or more containers that share the same network namespace and optional volumes.`,
    difficulty: 'intermediate',
    category: 'eks-coreks',
    quizId: 'eks-coreks-m01',
  },
  {
    id: 'eks-coreks-m01-what-is-a-kubernetes-service',
    text: `What is a Kubernetes Service?`,
    options: [
      { id: 'a', text: `A stable endpoint (IP + DNS name) that routes traffic to matching pods` },
      { id: 'b', text: `A running container inside a pod` },
      { id: 'c', text: `A configuration file for the cluster` },
      { id: 'd', text: `A network namespace shared between nodes` },
    ],
    correctOptionId: 'a',
    explanation: `A Service gives pods a stable ClusterIP and DNS name. kube-proxy uses iptables rules to route to healthy pods matching the Service\'s label selector.`,
    difficulty: 'intermediate',
    category: 'eks-coreks',
    quizId: 'eks-coreks-m01',
  },
  {
    id: 'eks-coreks-m01-how-do-containers-within-the-same-pod-co',
    text: `How do containers within the same Pod communicate with each other?`,
    options: [
      { id: 'a', text: `Via the Service ClusterIP` },
      { id: 'b', text: `Via the node\'s IP address` },
      { id: 'c', text: `Via localhost because they share a network namespace` },
      { id: 'd', text: `Via a dedicated inter-container network bridge` },
    ],
    correctOptionId: 'c',
    explanation: `Containers in the same Pod share a network namespace. They communicate via localhost:port. Each container gets a different port but the same IP.`,
    difficulty: 'intermediate',
    category: 'eks-coreks',
    quizId: 'eks-coreks-m01',
  },
  {
    id: 'eks-coreks-m01-which-control-plane-component-is-the-aut',
    text: `Which control plane component is the authoritative store of all Kubernetes cluster state?`,
    options: [
      { id: 'a', text: `kube-apiserver` },
      { id: 'b', text: `kube-scheduler` },
      { id: 'c', text: `etcd` },
      { id: 'd', text: `kube-controller-manager` },
    ],
    correctOptionId: 'c',
    explanation: `etcd is the distributed key-value store that holds ALL cluster state. Every kubectl get/apply ultimately reads from or writes to etcd. Losing etcd means losing the cluster state.`,
    difficulty: 'intermediate',
    category: 'eks-coreks',
    quizId: 'eks-coreks-m01',
  },
  {
    id: 'eks-coreks-m01-what-does-the-kube-controller-manager-do',
    text: `What does the kube-controller-manager do?`,
    options: [
      { id: 'a', text: `Routes traffic between pods` },
      { id: 'b', text: `Runs the reconciliation control loops (desired state vs actual state)` },
      { id: 'c', text: `Assigns pods to nodes` },
      { id: 'd', text: `Stores cluster configuration` },
    ],
    correctOptionId: 'b',
    explanation: `The controller manager runs controllers like the ReplicaSet controller, which continuously checks if the actual number of pods matches the desired count and creates/deletes pods to reconcile.`,
    difficulty: 'intermediate',
    category: 'eks-coreks',
    quizId: 'eks-coreks-m01',
  },
  {
    id: 'eks-coreks-m01-what-are-kubernetes-scheduler-predicates',
    text: `What are Kubernetes scheduler predicates?`,
    options: [
      { id: 'a', text: `Scores that determine the optimal node for pod placement` },
      { id: 'b', text: `Rules that determine if a pod CAN be scheduled on a node` },
      { id: 'c', text: `Annotations that control pod affinity` },
      { id: 'd', text: `Resource limits applied after pod creation` },
    ],
    correctOptionId: 'b',
    explanation: `Predicates are hard filters (pass/fail). A node must pass ALL predicates for a pod to be scheduled there. Examples: resource fit, taints, affinity, volume availability.`,
    difficulty: 'intermediate',
    category: 'eks-coreks',
    quizId: 'eks-coreks-m01',
  },
  {
    id: 'eks-coreks-m01-what-does-setting-resources-requests-cpu',
    text: `What does setting resources.requests.cpu on a pod do?`,
    options: [
      { id: 'a', text: `Sets a hard limit on CPU usage` },
      { id: 'b', text: `Tells the scheduler the guaranteed CPU needed — used to find eligible nodes` },
      { id: 'c', text: `Overrides the node\'s CPU allocation` },
      { id: 'd', text: `Enables CPU throttling for the container` },
    ],
    correctOptionId: 'b',
    explanation: `Requests tell the scheduler the GUARANTEED resource needed. The scheduler finds nodes with enough remaining allocatable resources. Limits are the maximum; requests drive scheduling.`,
    difficulty: 'intermediate',
    category: 'eks-coreks',
    quizId: 'eks-coreks-m01',
  },
  {
    id: 'eks-coreks-m01-what-happens-when-you-run-kubectl-apply',
    text: `What happens when you run kubectl apply -f deploy.yaml?`,
    options: [
      { id: 'a', text: `Deletes the resources defined in the file` },
      { id: 'b', text: `Creates or updates resources declaratively — if exists, patches to match file` },
      { id: 'c', text: `Always creates new resources even if they already exist` },
      { id: 'd', text: `Only works for Pod objects` },
    ],
    correctOptionId: 'b',
    explanation: `apply is declarative. If the resource doesn\'t exist, it creates it. If it does exist, it patches it to match the manifest. Idempotent. Unlike kubectl create which fails if resource exists.`,
    difficulty: 'intermediate',
    category: 'eks-coreks',
    quizId: 'eks-coreks-m01',
  },
  {
    id: 'eks-coreks-m01-what-is-a-kubernetes-daemonset-used-for',
    text: `What is a Kubernetes DaemonSet used for?`,
    options: [
      { id: 'a', text: `Running a fixed number of pod replicas` },
      { id: 'b', text: `Running exactly one pod on every node for node-level agents` },
      { id: 'c', text: `Scheduling periodic background jobs` },
      { id: 'd', text: `Managing stateful applications with persistent storage` },
    ],
    correctOptionId: 'b',
    explanation: `A DaemonSet ensures one pod runs on every node. Used for: Fluent Bit (log collection), node-exporter (metrics), aws-node (VPC CNI). NOTE: DaemonSets are NOT supported on AWS Fargate.`,
    difficulty: 'intermediate',
    category: 'eks-coreks',
    quizId: 'eks-coreks-m01',
  },
  {
    id: 'eks-coreks-m01-how-does-a-kubernetes-deployment-perform',
    text: `How does a Kubernetes Deployment perform a rolling update?`,
    options: [
      { id: 'a', text: `It deletes all old pods first, then creates new ones` },
      { id: 'b', text: `It creates a new ReplicaSet and gradually shifts pods from old to new` },
      { id: 'c', text: `It clones all pods simultaneously then deletes the originals` },
      { id: 'd', text: `It stops all traffic to the service during the update` },
    ],
    correctOptionId: 'b',
    explanation: `A Deployment creates a new ReplicaSet for the new version. It scales up the new RS while scaling down the old RS one pod at a time. kubectl rollout undo reverses this.`,
    difficulty: 'intermediate',
    category: 'eks-coreks',
    quizId: 'eks-coreks-m01',
  },
  {
    id: 'eks-coreks-m01-in-which-scenario-would-you-use-a-statef',
    text: `In which scenario would you use a StatefulSet instead of a Deployment?`,
    options: [
      { id: 'a', text: `Stateless web frontend with many replicas` },
      { id: 'b', text: `MySQL database where each replica needs its own stable storage and identity` },
      { id: 'c', text: `Batch job that runs once and exits` },
      { id: 'd', text: `Log collector running on every node` },
    ],
    correctOptionId: 'b',
    explanation: `StatefulSets are for stateful apps needing stable pod names (mysql-0, mysql-1), stable storage per pod, and ordered startup/shutdown. Use Deployments for stateless apps where pods are interchangeable.`,
    difficulty: 'intermediate',
    category: 'eks-coreks',
    quizId: 'eks-coreks-m01',
  },
  {
    id: 'eks-coreks-m01-what-is-the-default-storage-mechanism-fo',
    text: `What is the default storage mechanism for Kubernetes Secrets?`,
    options: [
      { id: 'a', text: `Encrypted with AES-256 in etcd` },
      { id: 'b', text: `Stored as plain text on disk` },
      { id: 'c', text: `Base64 encoded and stored in etcd (NOT encrypted by default)` },
      { id: 'd', text: `Encrypted with AWS KMS automatically` },
    ],
    correctOptionId: 'c',
    explanation: `Secrets are base64 encoded (NOT encrypted) in etcd by default. base64 is reversible encoding, not encryption. Enable envelope encryption with KMS for real security.`,
    difficulty: 'intermediate',
    category: 'eks-coreks',
    quizId: 'eks-coreks-m01',
  },
];

// ── Module 02: EKS Fundamentals ────────────────────────
export const eksCoreksM02Questions: Question[] = [
];

// ── Module 03: Building EKS Clusters ───────────────────
export const eksCoreksM03Questions: Question[] = [
];

// ── Module 04: Deploying Apps ──────────────────────────
export const eksCoreksM04Questions: Question[] = [
];

// ── Module 05: Scale & GitOps ──────────────────────────
export const eksCoreksM05Questions: Question[] = [
];

// ── Module 06: Networking ──────────────────────────────
export const eksCoreksM06Questions: Question[] = [
];

// ── Module 07: Observability ───────────────────────────
export const eksCoreksM07Questions: Question[] = [
];

// ── Module 08: Storage ─────────────────────────────────
export const eksCoreksM08Questions: Question[] = [
];

// ── Module 09: Security ────────────────────────────────
export const eksCoreksM09Questions: Question[] = [
];

// ── Full Course Exam ────────────────────────────────────────────
export const eksCoreksFullExamQuestions: Question[] = [
  ...eksCoreksM01Questions,
  ...eksCoreksM02Questions,
  ...eksCoreksM03Questions,
  ...eksCoreksM04Questions,
  ...eksCoreksM05Questions,
  ...eksCoreksM06Questions,
  ...eksCoreksM07Questions,
  ...eksCoreksM08Questions,
  ...eksCoreksM09Questions,
];
