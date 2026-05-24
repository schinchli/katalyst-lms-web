// AUTO-GENERATED from learnk8s/content-graph.json — do not hand-edit.
// Regenerate by running: python3 ~/Documents/Projects/learnk8s/scripts/sync_graph_to_lms.py
// (or run the inline command in CHANGELOG)

export type EksRel = "contains" | "covered_by" | "enables" | "prerequisite";
export type EksPageType = "animated-lab" | "flashcard" | "flashcard-index" | "index" | "interactive" | "reference";

export interface EksModule {
  id: string;
  order: number;
  title: string;
  badge: string;
  icon: string;
  color: string;
}

export interface EksPage {
  id: string;
  url: string;
  title: string;
  type: EksPageType;
  module: string | null;
}

export interface EksConcept {
  id: string;
  module: string;
  order: number;
  title: string;
  anchor: string;
  summary: string;
  pages: string[];
  prerequisites: string[];
  enables: string[];
}

export interface EksEdge {
  from: string;
  to: string;
  rel: EksRel;
  weight?: number;
}

export interface EksContentGraph {
  version: string;
  generated: string;
  platform: string;
  domain: string;
  modules: EksModule[];
  pages: EksPage[];
  concepts: EksConcept[];
  edges: EksEdge[];
}

export const content_graph: EksContentGraph = {
  "version": "1.0",
  "generated": "2026-05-23",
  "platform": "learnk8s",
  "domain": "AWS Running Containers on Amazon EKS (200-COREKS)",
  "modules": [
    {
      "id": "m01",
      "order": 1,
      "title": "Kubernetes Fundamentals",
      "badge": "MODULE 01",
      "icon": "📦",
      "color": "#4A90E2"
    },
    {
      "id": "m02",
      "order": 2,
      "title": "Amazon EKS Fundamentals",
      "badge": "MODULE 02",
      "icon": "🔶",
      "color": "#F39C12"
    },
    {
      "id": "m03",
      "order": 3,
      "title": "Building an EKS Cluster",
      "badge": "MODULE 03",
      "icon": "🔧",
      "color": "#38bdf8"
    },
    {
      "id": "m04",
      "order": 4,
      "title": "Deploying Applications",
      "badge": "MODULE 04",
      "icon": "🚀",
      "color": "#F39C12"
    },
    {
      "id": "m05",
      "order": 5,
      "title": "Managing Apps at Scale",
      "badge": "MODULE 05",
      "icon": "📈",
      "color": "#27AE60"
    },
    {
      "id": "m06",
      "order": 6,
      "title": "Managing Networking",
      "badge": "MODULE 06",
      "icon": "🌐",
      "color": "#818cf8"
    },
    {
      "id": "m07",
      "order": 7,
      "title": "Configuring Observability",
      "badge": "MODULE 07",
      "icon": "🔭",
      "color": "#38bdf8"
    },
    {
      "id": "m08",
      "order": 8,
      "title": "Managing Storage",
      "badge": "MODULE 08",
      "icon": "💾",
      "color": "#F39C12"
    },
    {
      "id": "m09",
      "order": 9,
      "title": "Managing Security",
      "badge": "MODULE 09",
      "icon": "🔐",
      "color": "#F39C12"
    }
  ],
  "pages": [
    {
      "id": "page:dashboard",
      "url": "lab-1-deploying-pods/index.html",
      "title": "K8s Labs Dashboard",
      "type": "index",
      "module": null
    },
    {
      "id": "page:learn-visually",
      "url": "lab-1-deploying-pods/learn-visually.html",
      "title": "Kubernetes, visually",
      "type": "reference",
      "module": null
    },
    {
      "id": "page:deep-dive",
      "url": "lab-1-deploying-pods/deep-dive.html",
      "title": "Deep Dive — Every Component",
      "type": "reference",
      "module": null
    },
    {
      "id": "page:cluster-explained",
      "url": "lab-1-deploying-pods/cluster-explained.html",
      "title": "Live Cluster Visual",
      "type": "reference",
      "module": null
    },
    {
      "id": "page:visual-concepts",
      "url": "lab-1-deploying-pods/visual-concepts.html",
      "title": "Visual Concepts — Animated",
      "type": "interactive",
      "module": null
    },
    {
      "id": "page:lab1-core",
      "url": "lab-1-deploying-pods/animated-lab.html",
      "title": "Lab 1: Core Concepts",
      "type": "animated-lab",
      "module": "m01"
    },
    {
      "id": "page:lab1-production",
      "url": "lab-1-deploying-pods/animated-lab-production.html",
      "title": "Production Scenarios",
      "type": "animated-lab",
      "module": "m01"
    },
    {
      "id": "page:lab1-aws",
      "url": "lab-1-deploying-pods/animated-lab-aws.html",
      "title": "AWS EKS Lab",
      "type": "animated-lab",
      "module": "m02"
    },
    {
      "id": "page:lab1-kubectl",
      "url": "lab-1-deploying-pods/animated-commands.html",
      "title": "kubectl Live Terminal",
      "type": "interactive",
      "module": "m01"
    },
    {
      "id": "page:anim-m01",
      "url": "lab-1-deploying-pods/animated-lab-kubernetes-fundamentals.html",
      "title": "K8s Fundamentals Lab",
      "type": "animated-lab",
      "module": "m01"
    },
    {
      "id": "page:anim-m02",
      "url": "lab-1-deploying-pods/animated-lab-eks-fundamentals.html",
      "title": "EKS Fundamentals Lab",
      "type": "animated-lab",
      "module": "m02"
    },
    {
      "id": "page:anim-m03",
      "url": "lab-1-deploying-pods/animated-lab-building-eks-cluster.html",
      "title": "Building EKS Clusters Lab",
      "type": "animated-lab",
      "module": "m03"
    },
    {
      "id": "page:anim-m04",
      "url": "lab-1-deploying-pods/animated-lab-deploying-apps.html",
      "title": "Deploying Apps Lab",
      "type": "animated-lab",
      "module": "m04"
    },
    {
      "id": "page:anim-m05",
      "url": "lab-1-deploying-pods/animated-lab-scale-gitops.html",
      "title": "Scale & GitOps Lab",
      "type": "animated-lab",
      "module": "m05"
    },
    {
      "id": "page:anim-m06",
      "url": "lab-1-deploying-pods/animated-lab-networking.html",
      "title": "EKS Networking Lab",
      "type": "animated-lab",
      "module": "m06"
    },
    {
      "id": "page:anim-m07",
      "url": "lab-1-deploying-pods/animated-lab-observability.html",
      "title": "Observability Lab",
      "type": "animated-lab",
      "module": "m07"
    },
    {
      "id": "page:anim-m08",
      "url": "lab-1-deploying-pods/animated-lab-storage.html",
      "title": "Storage in EKS Lab",
      "type": "animated-lab",
      "module": "m08"
    },
    {
      "id": "page:anim-m09",
      "url": "lab-1-deploying-pods/animated-lab-security.html",
      "title": "Security in EKS Lab",
      "type": "animated-lab",
      "module": "m09"
    },
    {
      "id": "page:flash-index",
      "url": "course-flashcards/index.html",
      "title": "EKS Flashcard Hub",
      "type": "flashcard-index",
      "module": null
    },
    {
      "id": "page:flash-m01",
      "url": "course-flashcards/module-01/index.html",
      "title": "Module 01 Flashcards",
      "type": "flashcard",
      "module": "m01"
    },
    {
      "id": "page:flash-m02",
      "url": "course-flashcards/module-02/index.html",
      "title": "Module 02 Flashcards",
      "type": "flashcard",
      "module": "m02"
    },
    {
      "id": "page:flash-m03",
      "url": "course-flashcards/module-03/index.html",
      "title": "Module 03 Flashcards",
      "type": "flashcard",
      "module": "m03"
    },
    {
      "id": "page:flash-m04",
      "url": "course-flashcards/module-04/index.html",
      "title": "Module 04 Flashcards",
      "type": "flashcard",
      "module": "m04"
    },
    {
      "id": "page:flash-m05",
      "url": "course-flashcards/module-05/index.html",
      "title": "Module 05 Flashcards",
      "type": "flashcard",
      "module": "m05"
    },
    {
      "id": "page:flash-m06",
      "url": "course-flashcards/module-06/index.html",
      "title": "Module 06 Flashcards",
      "type": "flashcard",
      "module": "m06"
    },
    {
      "id": "page:flash-m07",
      "url": "course-flashcards/module-07/index.html",
      "title": "Module 07 Flashcards",
      "type": "flashcard",
      "module": "m07"
    },
    {
      "id": "page:flash-m08",
      "url": "course-flashcards/module-08/index.html",
      "title": "Module 08 Flashcards",
      "type": "flashcard",
      "module": "m08"
    },
    {
      "id": "page:flash-m09",
      "url": "course-flashcards/module-09/index.html",
      "title": "Module 09 Flashcards",
      "type": "flashcard",
      "module": "m09"
    }
  ],
  "concepts": [
    {
      "id": "concept:container",
      "module": "m01",
      "order": 1,
      "title": "Container",
      "anchor": "container",
      "summary": "A Linux process isolated via namespaces, cgroups, and overlay filesystems. Shares the host kernel — milliseconds to start, MBs of RAM.",
      "pages": [
        "page:learn-visually",
        "page:anim-m01",
        "page:lab1-core",
        "page:deep-dive",
        "page:flash-m01"
      ],
      "prerequisites": [],
      "enables": [
        "concept:pod",
        "concept:image",
        "concept:container-runtime"
      ]
    },
    {
      "id": "concept:pod",
      "module": "m01",
      "order": 2,
      "title": "Pod",
      "anchor": "pod",
      "summary": "Smallest deployable unit. Wraps one or more containers sharing a network namespace (one IP, one localhost) and optional volumes.",
      "pages": [
        "page:learn-visually",
        "page:deep-dive",
        "page:anim-m01",
        "page:lab1-core",
        "page:cluster-explained",
        "page:flash-m01"
      ],
      "prerequisites": [
        "concept:container"
      ],
      "enables": [
        "concept:replicaset",
        "concept:probes",
        "concept:resource-limits"
      ]
    },
    {
      "id": "concept:replicaset",
      "module": "m01",
      "order": 3,
      "title": "ReplicaSet",
      "anchor": "replicaset",
      "summary": "Keeps exactly N pods matching a label selector alive at all times. Auto-created by Deployment — rarely written directly.",
      "pages": [
        "page:learn-visually",
        "page:anim-m01",
        "page:lab1-core",
        "page:flash-m01"
      ],
      "prerequisites": [
        "concept:pod",
        "concept:labels-selectors"
      ],
      "enables": [
        "concept:deployment"
      ]
    },
    {
      "id": "concept:deployment",
      "module": "m01",
      "order": 4,
      "title": "Deployment",
      "anchor": "deployment",
      "summary": "Manages stateless apps: pod template + replica count + rolling update strategy. Creates/replaces ReplicaSets on spec change. Enables rollback.",
      "pages": [
        "page:learn-visually",
        "page:deep-dive",
        "page:anim-m01",
        "page:lab1-core",
        "page:cluster-explained",
        "page:flash-m01"
      ],
      "prerequisites": [
        "concept:replicaset"
      ],
      "enables": [
        "concept:rolling-update",
        "concept:statefulset"
      ]
    },
    {
      "id": "concept:service",
      "module": "m01",
      "order": 5,
      "title": "Service",
      "anchor": "service",
      "summary": "Stable virtual IP + DNS name in front of dynamic pods. kube-proxy writes iptables rules on every node. Four types: ClusterIP, NodePort, LoadBalancer, ExternalName.",
      "pages": [
        "page:learn-visually",
        "page:deep-dive",
        "page:anim-m01",
        "page:lab1-core",
        "page:cluster-explained",
        "page:flash-m01"
      ],
      "prerequisites": [
        "concept:pod",
        "concept:labels-selectors"
      ],
      "enables": [
        "concept:ingress",
        "concept:service-types"
      ]
    },
    {
      "id": "concept:namespace",
      "module": "m01",
      "order": 6,
      "title": "Namespace",
      "anchor": "namespace",
      "summary": "Virtual cluster inside your cluster. Scopes names, applies ResourceQuotas, forms RBAC boundary. System namespaces: default, kube-system, kube-public.",
      "pages": [
        "page:learn-visually",
        "page:deep-dive",
        "page:anim-m01",
        "page:cluster-explained",
        "page:flash-m01"
      ],
      "prerequisites": [
        "concept:pod"
      ],
      "enables": [
        "concept:rbac",
        "concept:network-policies"
      ]
    },
    {
      "id": "concept:configmap",
      "module": "m01",
      "order": 7,
      "title": "ConfigMap",
      "anchor": "configmap",
      "summary": "Non-sensitive configuration: feature flags, hostnames, log levels, entire config files. Stored in etcd as plaintext. Consumed as env vars or volume-mounted files.",
      "pages": [
        "page:deep-dive",
        "page:anim-m01",
        "page:flash-m01"
      ],
      "prerequisites": [
        "concept:pod"
      ],
      "enables": [
        "concept:secret"
      ]
    },
    {
      "id": "concept:secret",
      "module": "m01",
      "order": 8,
      "title": "Secret",
      "anchor": "secret",
      "summary": "Sensitive data (passwords, TLS certs, tokens). base64 encoded by default — NOT encrypted. Add KMS envelope encryption for real security. Consume as volume mount, not env var.",
      "pages": [
        "page:deep-dive",
        "page:cluster-explained",
        "page:anim-m01",
        "page:flash-m01"
      ],
      "prerequisites": [
        "concept:configmap"
      ],
      "enables": [
        "concept:ascp",
        "concept:irsa"
      ]
    },
    {
      "id": "concept:labels-selectors",
      "module": "m01",
      "order": 9,
      "title": "Labels & Selectors",
      "anchor": "labels",
      "summary": "Every 'X routes to Y' relationship in K8s is implemented with labels. Services select pods. Deployments manage ReplicaSets. NetworkPolicies scope to pods.",
      "pages": [
        "page:learn-visually",
        "page:anim-m01",
        "page:flash-m01"
      ],
      "prerequisites": [
        "concept:pod"
      ],
      "enables": [
        "concept:service",
        "concept:replicaset",
        "concept:network-policies"
      ]
    },
    {
      "id": "concept:probes",
      "module": "m01",
      "order": 10,
      "title": "Liveness & Readiness Probes",
      "anchor": "probes",
      "summary": "Liveness fails → kubelet kills + restarts container (RESTARTS++). Readiness fails → pod removed from Service Endpoints (stays alive). Both are HTTP/TCP/exec checks.",
      "pages": [
        "page:learn-visually",
        "page:anim-m01",
        "page:lab1-core",
        "page:flash-m01"
      ],
      "prerequisites": [
        "concept:pod",
        "concept:service"
      ],
      "enables": [
        "concept:rolling-update"
      ]
    },
    {
      "id": "concept:rolling-update",
      "module": "m01",
      "order": 11,
      "title": "Rolling Update",
      "anchor": "rolling-update",
      "summary": "maxSurge + maxUnavailable control the handoff from v1 RS to v2 RS. Service Endpoints only include Ready pods throughout. kubectl rollout undo reverts instantly.",
      "pages": [
        "page:learn-visually",
        "page:visual-concepts",
        "page:anim-m01",
        "page:lab1-core",
        "page:flash-m01"
      ],
      "prerequisites": [
        "concept:deployment",
        "concept:probes",
        "concept:service"
      ],
      "enables": [
        "concept:hpa"
      ]
    },
    {
      "id": "concept:control-plane",
      "module": "m01",
      "order": 12,
      "title": "Control Plane",
      "anchor": "control-plane",
      "summary": "api-server (gatekeeper), etcd (source of truth), scheduler (pod placement), controller-manager (reconciliation loops). On EKS, AWS manages all four across 3 AZs.",
      "pages": [
        "page:deep-dive",
        "page:cluster-explained",
        "page:anim-m01",
        "page:flash-m01"
      ],
      "prerequisites": [
        "concept:pod",
        "concept:deployment"
      ],
      "enables": [
        "concept:eks-architecture",
        "concept:upgrade-sequence"
      ]
    },
    {
      "id": "concept:daemonset",
      "module": "m01",
      "order": 13,
      "title": "DaemonSet",
      "anchor": "daemonset",
      "summary": "One pod per node, automatically. When node joins, pod appears. Node leaves, pod GC'd. Cannot run on Fargate. Use for: Fluent Bit, node-exporter, aws-node VPC CNI.",
      "pages": [
        "page:deep-dive",
        "page:visual-concepts",
        "page:flash-m01"
      ],
      "prerequisites": [
        "concept:pod",
        "concept:node"
      ],
      "enables": [
        "concept:fluent-bit",
        "concept:vpc-cni"
      ]
    },
    {
      "id": "concept:statefulset",
      "module": "m01",
      "order": 14,
      "title": "StatefulSet",
      "anchor": "statefulset",
      "summary": "Ordered pods with stable names (mysql-0,1,2), stable DNS (mysql-0.svc), and per-pod PVCs that survive restarts. Requires a headless Service for DNS.",
      "pages": [
        "page:deep-dive",
        "page:visual-concepts",
        "page:anim-m08",
        "page:flash-m01",
        "page:flash-m08"
      ],
      "prerequisites": [
        "concept:deployment",
        "concept:pv-pvc"
      ],
      "enables": [
        "concept:pv-pvc"
      ]
    },
    {
      "id": "concept:node",
      "module": "m01",
      "order": 15,
      "title": "Node",
      "anchor": "node",
      "summary": "Worker machine (EC2 on EKS). Reports capacity vs allocatable (capacity − kube-system reserved). Scheduler uses allocatable, not capacity.",
      "pages": [
        "page:deep-dive",
        "page:cluster-explained",
        "page:flash-m01"
      ],
      "prerequisites": [
        "concept:pod"
      ],
      "enables": [
        "concept:managed-node-groups",
        "concept:karpenter",
        "concept:cluster-autoscaler"
      ]
    },
    {
      "id": "concept:resource-limits",
      "module": "m01",
      "order": 16,
      "title": "Resource Requests & Limits",
      "anchor": "resources",
      "summary": "Requests: what the scheduler uses for placement. Limits: what the runtime enforces (OOMKilled if memory exceeded, throttled if CPU exceeded).",
      "pages": [
        "page:deep-dive",
        "page:anim-m01",
        "page:flash-m01"
      ],
      "prerequisites": [
        "concept:pod",
        "concept:node"
      ],
      "enables": [
        "concept:vpa",
        "concept:hpa"
      ]
    },
    {
      "id": "concept:eks-architecture",
      "module": "m02",
      "order": 1,
      "title": "EKS Architecture",
      "anchor": "eks-architecture",
      "summary": "Control plane (AWS-managed, 3 AZs) + data plane (your EC2/Fargate). EKS Distro = upstream K8s. Two APIs: kubectl (K8s objects) + eksctl/AWS API (cluster lifecycle).",
      "pages": [
        "page:lab1-aws",
        "page:anim-m02",
        "page:flash-m02"
      ],
      "prerequisites": [
        "concept:control-plane"
      ],
      "enables": [
        "concept:managed-node-groups",
        "concept:fargate-profiles",
        "concept:iam-eks"
      ]
    },
    {
      "id": "concept:managed-node-groups",
      "module": "m02",
      "order": 2,
      "title": "Managed Node Groups",
      "anchor": "managed-node-groups",
      "summary": "AWS manages EC2 lifecycle within an ASG. Supported AMI types: AL2, AL2023, Bottlerocket, Windows. Upgrade is rolling — drain, replace, rejoin.",
      "pages": [
        "page:anim-m02",
        "page:anim-m03",
        "page:flash-m02"
      ],
      "prerequisites": [
        "concept:eks-architecture",
        "concept:node"
      ],
      "enables": [
        "concept:cluster-autoscaler",
        "concept:upgrade-sequence"
      ]
    },
    {
      "id": "concept:fargate-profiles",
      "module": "m02",
      "order": 3,
      "title": "Fargate Profiles",
      "anchor": "fargate-profiles",
      "summary": "Serverless pods — no nodes to manage. Matched by namespace+label selectors. Limitations: no DaemonSets, no hostNetwork, no privileged containers, no GPUs.",
      "pages": [
        "page:anim-m02",
        "page:flash-m02"
      ],
      "prerequisites": [
        "concept:eks-architecture",
        "concept:pod"
      ],
      "enables": [
        "concept:fargate-logging"
      ]
    },
    {
      "id": "concept:eksctl-create",
      "module": "m03",
      "order": 1,
      "title": "eksctl Cluster Creation",
      "anchor": "eksctl-create",
      "summary": "eksctl create cluster creates VPC, IAM roles, cluster, node group, kubeconfig in one command. cluster.yaml is the production pattern — version-controllable.",
      "pages": [
        "page:anim-m03",
        "page:flash-m03"
      ],
      "prerequisites": [
        "concept:eks-architecture"
      ],
      "enables": [
        "concept:upgrade-sequence"
      ]
    },
    {
      "id": "concept:upgrade-sequence",
      "module": "m03",
      "order": 2,
      "title": "EKS Upgrade Sequence",
      "anchor": "upgrade-sequence",
      "summary": "8 steps in order: review release notes → backup → identify API changes → check node versioning → upgrade control plane → upgrade add-ons → upgrade kubectl → upgrade data plane. Control plane always first.",
      "pages": [
        "page:anim-m03",
        "page:flash-m03"
      ],
      "prerequisites": [
        "concept:eks-architecture",
        "concept:managed-node-groups"
      ],
      "enables": []
    },
    {
      "id": "concept:eks-addons",
      "module": "m03",
      "order": 3,
      "title": "EKS Add-ons",
      "anchor": "eks-addons",
      "summary": "AWS-managed lifecycle for: VPC CNI, kube-proxy, CoreDNS, EBS CSI driver, EFS CSI driver. Each has a compatibility matrix with K8s versions. Upgrade separately from cluster.",
      "pages": [
        "page:anim-m03",
        "page:flash-m03"
      ],
      "prerequisites": [
        "concept:eksctl-create"
      ],
      "enables": [
        "concept:vpc-cni",
        "concept:ebs-csi",
        "concept:efs-csi"
      ]
    },
    {
      "id": "concept:ecr",
      "module": "m04",
      "order": 1,
      "title": "Amazon ECR",
      "anchor": "ecr",
      "summary": "Fully managed container registry. IAM-native auth (no extra credentials on AWS). Two scanning tiers: basic (on push) and enhanced (Inspector, continuous CVE tracking).",
      "pages": [
        "page:anim-m04",
        "page:flash-m04"
      ],
      "prerequisites": [
        "concept:container"
      ],
      "enables": [
        "concept:helm",
        "concept:image-scanning"
      ]
    },
    {
      "id": "concept:image-scanning",
      "module": "m04",
      "order": 2,
      "title": "ECR Image Scanning",
      "anchor": "image-scanning",
      "summary": "Basic: on-push CVE scan. Enhanced (Inspector): continuous scanning, finds new CVEs after push, shows exploitability. Block deploys on CRITICAL findings via CI/CD gate.",
      "pages": [
        "page:anim-m04",
        "page:flash-m04"
      ],
      "prerequisites": [
        "concept:ecr"
      ],
      "enables": []
    },
    {
      "id": "concept:helm",
      "module": "m04",
      "order": 3,
      "title": "Helm Charts",
      "anchor": "helm",
      "summary": "Package manager for K8s. Chart = templates + values.yaml. helm install injects values → renders YAML → applies to cluster. Versioned, rollback-able.",
      "pages": [
        "page:anim-m04",
        "page:flash-m04"
      ],
      "prerequisites": [
        "concept:deployment",
        "concept:service"
      ],
      "enables": []
    },
    {
      "id": "concept:hpa",
      "module": "m05",
      "order": 1,
      "title": "HPA — Horizontal Pod Autoscaler",
      "anchor": "hpa",
      "summary": "Scales pod count on CPU/memory/custom metrics. min/max bounds prevent runaway scaling. Works with Metrics Server. Do NOT combine with VPA on same CPU metric.",
      "pages": [
        "page:anim-m05",
        "page:flash-m05"
      ],
      "prerequisites": [
        "concept:deployment",
        "concept:resource-limits"
      ],
      "enables": [
        "concept:cluster-autoscaler",
        "concept:karpenter"
      ]
    },
    {
      "id": "concept:vpa",
      "module": "m05",
      "order": 2,
      "title": "VPA — Vertical Pod Autoscaler",
      "anchor": "vpa",
      "summary": "Scales pod resource requests/limits. 3 pods: recommender, updater, admission-controller. Modes: Off/Initial/Auto. Evicts pods to apply new sizes.",
      "pages": [
        "page:anim-m05",
        "page:flash-m05"
      ],
      "prerequisites": [
        "concept:resource-limits"
      ],
      "enables": []
    },
    {
      "id": "concept:cluster-autoscaler",
      "module": "m05",
      "order": 3,
      "title": "Cluster Autoscaler",
      "anchor": "cluster-autoscaler",
      "summary": "Watches Pending pods → calls ASG DesiredCapacity to add nodes. Works via ASG — slower than Karpenter. Use auto-discovery tag on node groups.",
      "pages": [
        "page:anim-m05",
        "page:flash-m05"
      ],
      "prerequisites": [
        "concept:managed-node-groups",
        "concept:hpa"
      ],
      "enables": []
    },
    {
      "id": "concept:karpenter",
      "module": "m05",
      "order": 4,
      "title": "Karpenter",
      "anchor": "karpenter",
      "summary": "Bypasses ASG — calls EC2 Fleet API directly. Right-sized instances per workload. Faster than CA. NodePool CRD defines constraints. do-not-disrupt annotation for critical pods.",
      "pages": [
        "page:anim-m05",
        "page:flash-m05"
      ],
      "prerequisites": [
        "concept:node",
        "concept:hpa"
      ],
      "enables": []
    },
    {
      "id": "concept:gitops-argocd",
      "module": "m05",
      "order": 5,
      "title": "GitOps & Argo CD",
      "anchor": "gitops",
      "summary": "Git = single source of truth. Argo CD continuously reconciles cluster state to Git. Drift = auto-revert. Key exam concept: drift detection.",
      "pages": [
        "page:anim-m05",
        "page:flash-m05"
      ],
      "prerequisites": [
        "concept:deployment",
        "concept:helm"
      ],
      "enables": []
    },
    {
      "id": "concept:vpc-cni",
      "module": "m06",
      "order": 1,
      "title": "Amazon VPC CNI",
      "anchor": "vpc-cni",
      "summary": "Pods get real VPC IPs from ENI secondary addresses. No overlay, no encapsulation. Same IP inside pod as visible to VPC. Direct routing at native VPC speed.",
      "pages": [
        "page:anim-m06",
        "page:flash-m06"
      ],
      "prerequisites": [
        "concept:eks-architecture",
        "concept:pod"
      ],
      "enables": [
        "concept:service-types",
        "concept:network-policies"
      ]
    },
    {
      "id": "concept:service-types",
      "module": "m06",
      "order": 2,
      "title": "Service Types",
      "anchor": "service-types",
      "summary": "ClusterIP: internal only. NodePort: node-IP:30000-32767. LoadBalancer: AWS NLB. ExternalName: DNS alias. Ingress: HTTP path routing via ALB (needs AWS LB Controller).",
      "pages": [
        "page:deep-dive",
        "page:anim-m06",
        "page:flash-m06"
      ],
      "prerequisites": [
        "concept:service",
        "concept:vpc-cni"
      ],
      "enables": [
        "concept:ingress"
      ]
    },
    {
      "id": "concept:ingress",
      "module": "m06",
      "order": 3,
      "title": "Ingress & ALB Controller",
      "anchor": "ingress",
      "summary": "HTTP/HTTPS path and host routing via AWS ALB. Requires AWS Load Balancer Controller add-on. Annotations control ALB behavior (scheme, target-type, certificate-arn).",
      "pages": [
        "page:anim-m06",
        "page:flash-m06"
      ],
      "prerequisites": [
        "concept:service-types"
      ],
      "enables": []
    },
    {
      "id": "concept:network-policies",
      "module": "m06",
      "order": 4,
      "title": "Network Policies",
      "anchor": "network-policies",
      "summary": "Default-deny + selective allow = zero-trust pod-to-pod networking. Ingress + Egress rules. Must install a CNI that enforces them (VPC CNI with Network Policy add-on, Calico).",
      "pages": [
        "page:anim-m06",
        "page:flash-m06"
      ],
      "prerequisites": [
        "concept:vpc-cni",
        "concept:namespace",
        "concept:labels-selectors"
      ],
      "enables": []
    },
    {
      "id": "concept:coredns",
      "module": "m06",
      "order": 5,
      "title": "CoreDNS",
      "anchor": "coredns",
      "summary": "3 DNS layers: CoreDNS (cluster: service.ns.svc.cluster.local) → Route 53 VPC resolver (AWS hostnames) → upstream internet. EKS add-on — version tied to K8s version.",
      "pages": [
        "page:anim-m06",
        "page:flash-m06"
      ],
      "prerequisites": [
        "concept:service",
        "concept:eks-addons"
      ],
      "enables": []
    },
    {
      "id": "concept:three-pillars",
      "module": "m07",
      "order": 1,
      "title": "3 Pillars of Observability",
      "anchor": "three-pillars",
      "summary": "Metrics (CPU/mem/req/s over time), Logs (discrete events), Traces (end-to-end request flow). All three required. Monitoring = when. Observability = why.",
      "pages": [
        "page:anim-m07",
        "page:flash-m07"
      ],
      "prerequisites": [
        "concept:eks-architecture"
      ],
      "enables": [
        "concept:prometheus",
        "concept:fluent-bit",
        "concept:xray"
      ]
    },
    {
      "id": "concept:prometheus",
      "module": "m07",
      "order": 2,
      "title": "Prometheus & Grafana",
      "anchor": "prometheus",
      "summary": "Prometheus scrapes /metrics endpoints via PromQL pull model. Grafana visualises. Amazon Managed Prometheus (AMP) is the serverless option on EKS.",
      "pages": [
        "page:anim-m07",
        "page:flash-m07"
      ],
      "prerequisites": [
        "concept:three-pillars"
      ],
      "enables": []
    },
    {
      "id": "concept:cloudwatch-insights",
      "module": "m07",
      "order": 3,
      "title": "CloudWatch Container Insights",
      "anchor": "cloudwatch-insights",
      "summary": "AWS-managed metrics: cluster, node, pod, container aggregation. Automatic alarms. Fargate: needs Fluent Bit ConfigMap in aws-observability namespace (no DaemonSet).",
      "pages": [
        "page:anim-m07",
        "page:flash-m07"
      ],
      "prerequisites": [
        "concept:three-pillars",
        "concept:daemonset"
      ],
      "enables": []
    },
    {
      "id": "concept:fluent-bit",
      "module": "m07",
      "order": 4,
      "title": "Fluent Bit Log Routing",
      "anchor": "fluent-bit",
      "summary": "DaemonSet on every EC2 node reads /var/log/containers/*. Routes to OpenSearch, S3, CloudWatch, Firehose. 5 control plane log types toggleable in EKS console.",
      "pages": [
        "page:anim-m07",
        "page:flash-m07"
      ],
      "prerequisites": [
        "concept:daemonset",
        "concept:three-pillars"
      ],
      "enables": []
    },
    {
      "id": "concept:xray",
      "module": "m07",
      "order": 5,
      "title": "AWS X-Ray & ADOT",
      "anchor": "xray",
      "summary": "Distributed tracing. ADOT (AWS Distro for OpenTelemetry) collects traces → X-Ray. Service map shows latency per hop. Sidecar or DaemonSet deployment patterns.",
      "pages": [
        "page:anim-m07",
        "page:flash-m07"
      ],
      "prerequisites": [
        "concept:three-pillars"
      ],
      "enables": []
    },
    {
      "id": "concept:pv-pvc",
      "module": "m08",
      "order": 1,
      "title": "PV / PVC / StorageClass",
      "anchor": "pv-pvc",
      "summary": "PV = actual storage provisioned. PVC = user's request (size, access mode). StorageClass = auto-provision policy. Dynamic provisioning: PVC → StorageClass → CSI driver → AWS volume.",
      "pages": [
        "page:deep-dive",
        "page:anim-m08",
        "page:flash-m08"
      ],
      "prerequisites": [
        "concept:pod"
      ],
      "enables": [
        "concept:ebs-csi",
        "concept:efs-csi",
        "concept:statefulset"
      ]
    },
    {
      "id": "concept:ebs-csi",
      "module": "m08",
      "order": 2,
      "title": "EBS CSI Driver",
      "anchor": "ebs-csi",
      "summary": "ReadWriteOnce — single node only. gp3 is default storage class. NOT compatible with Fargate. Per-replica storage (each StatefulSet pod gets its own EBS volume).",
      "pages": [
        "page:anim-m08",
        "page:flash-m08"
      ],
      "prerequisites": [
        "concept:pv-pvc",
        "concept:eks-addons"
      ],
      "enables": []
    },
    {
      "id": "concept:efs-csi",
      "module": "m08",
      "order": 3,
      "title": "EFS CSI Driver",
      "anchor": "efs-csi",
      "summary": "ReadWriteMany — shared across multiple nodes AND Fargate pods. Auto-elastic. NFSv4 protocol. Use for shared data, ML training sets, content repos.",
      "pages": [
        "page:anim-m08",
        "page:flash-m08"
      ],
      "prerequisites": [
        "concept:pv-pvc",
        "concept:eks-addons"
      ],
      "enables": []
    },
    {
      "id": "concept:ascp",
      "module": "m08",
      "order": 4,
      "title": "AWS Secrets & Config Provider (ASCP)",
      "anchor": "ascp",
      "summary": "Secrets Manager → pod file via CSI driver. Auto-rotation synced to pod. Requires IRSA for access control. Secret never in etcd or env vars.",
      "pages": [
        "page:anim-m08",
        "page:flash-m08"
      ],
      "prerequisites": [
        "concept:secret",
        "concept:irsa"
      ],
      "enables": []
    },
    {
      "id": "concept:four-cs",
      "module": "m09",
      "order": 1,
      "title": "4Cs Security Model",
      "anchor": "four-cs",
      "summary": "Cloud → Cluster → Container → Code. Each layer wraps the next. Failure in outer layer exposes inner. Must secure all four simultaneously — defense in depth.",
      "pages": [
        "page:anim-m09",
        "page:flash-m09"
      ],
      "prerequisites": [
        "concept:eks-architecture"
      ],
      "enables": [
        "concept:iam-eks",
        "concept:rbac"
      ]
    },
    {
      "id": "concept:iam-eks",
      "module": "m09",
      "order": 2,
      "title": "IAM for EKS",
      "anchor": "iam-eks",
      "summary": "Two auth layers: AWS IAM (who can call the EKS API) and K8s RBAC (what they can do inside the cluster). Mapped via aws-auth ConfigMap or EKS Access Entries.",
      "pages": [
        "page:anim-m09",
        "page:flash-m09"
      ],
      "prerequisites": [
        "concept:four-cs"
      ],
      "enables": [
        "concept:irsa",
        "concept:rbac"
      ]
    },
    {
      "id": "concept:rbac",
      "module": "m09",
      "order": 3,
      "title": "RBAC",
      "anchor": "rbac",
      "summary": "Role (namespace) + ClusterRole (cluster-wide) define allowed verbs on resources. RoleBinding/ClusterRoleBinding attach to subjects (User, Group, ServiceAccount).",
      "pages": [
        "page:anim-m09",
        "page:flash-m09"
      ],
      "prerequisites": [
        "concept:iam-eks",
        "concept:namespace"
      ],
      "enables": [
        "concept:irsa"
      ]
    },
    {
      "id": "concept:irsa",
      "module": "m09",
      "order": 4,
      "title": "IRSA — IAM Roles for Service Accounts",
      "anchor": "irsa",
      "summary": "Maps K8s ServiceAccount to AWS IAM role via OIDC federation. Pod gets temporary AWS credentials via projected token — no EC2 instance role sharing, no key management.",
      "pages": [
        "page:anim-m09",
        "page:anim-m08",
        "page:flash-m09"
      ],
      "prerequisites": [
        "concept:rbac",
        "concept:fargate-profiles"
      ],
      "enables": [
        "concept:ascp"
      ]
    }
  ],
  "edges": [
    {
      "from": "concept:container",
      "to": "concept:pod",
      "rel": "enables",
      "weight": 0.8
    },
    {
      "from": "concept:container",
      "to": "concept:image",
      "rel": "enables",
      "weight": 0.8
    },
    {
      "from": "concept:container",
      "to": "concept:container-runtime",
      "rel": "enables",
      "weight": 0.8
    },
    {
      "from": "concept:container",
      "to": "concept:pod",
      "rel": "prerequisite",
      "weight": 1.0
    },
    {
      "from": "concept:pod",
      "to": "concept:replicaset",
      "rel": "enables",
      "weight": 0.8
    },
    {
      "from": "concept:pod",
      "to": "concept:probes",
      "rel": "enables",
      "weight": 0.8
    },
    {
      "from": "concept:pod",
      "to": "concept:resource-limits",
      "rel": "enables",
      "weight": 0.8
    },
    {
      "from": "concept:pod",
      "to": "concept:replicaset",
      "rel": "prerequisite",
      "weight": 1.0
    },
    {
      "from": "concept:labels-selectors",
      "to": "concept:replicaset",
      "rel": "prerequisite",
      "weight": 1.0
    },
    {
      "from": "concept:replicaset",
      "to": "concept:deployment",
      "rel": "enables",
      "weight": 0.8
    },
    {
      "from": "concept:replicaset",
      "to": "concept:deployment",
      "rel": "prerequisite",
      "weight": 1.0
    },
    {
      "from": "concept:deployment",
      "to": "concept:rolling-update",
      "rel": "enables",
      "weight": 0.8
    },
    {
      "from": "concept:deployment",
      "to": "concept:statefulset",
      "rel": "enables",
      "weight": 0.8
    },
    {
      "from": "concept:pod",
      "to": "concept:service",
      "rel": "prerequisite",
      "weight": 1.0
    },
    {
      "from": "concept:labels-selectors",
      "to": "concept:service",
      "rel": "prerequisite",
      "weight": 1.0
    },
    {
      "from": "concept:service",
      "to": "concept:ingress",
      "rel": "enables",
      "weight": 0.8
    },
    {
      "from": "concept:service",
      "to": "concept:service-types",
      "rel": "enables",
      "weight": 0.8
    },
    {
      "from": "concept:pod",
      "to": "concept:namespace",
      "rel": "prerequisite",
      "weight": 1.0
    },
    {
      "from": "concept:namespace",
      "to": "concept:rbac",
      "rel": "enables",
      "weight": 0.8
    },
    {
      "from": "concept:namespace",
      "to": "concept:network-policies",
      "rel": "enables",
      "weight": 0.8
    },
    {
      "from": "concept:pod",
      "to": "concept:configmap",
      "rel": "prerequisite",
      "weight": 1.0
    },
    {
      "from": "concept:configmap",
      "to": "concept:secret",
      "rel": "enables",
      "weight": 0.8
    },
    {
      "from": "concept:configmap",
      "to": "concept:secret",
      "rel": "prerequisite",
      "weight": 1.0
    },
    {
      "from": "concept:secret",
      "to": "concept:ascp",
      "rel": "enables",
      "weight": 0.8
    },
    {
      "from": "concept:secret",
      "to": "concept:irsa",
      "rel": "enables",
      "weight": 0.8
    },
    {
      "from": "concept:pod",
      "to": "concept:labels-selectors",
      "rel": "prerequisite",
      "weight": 1.0
    },
    {
      "from": "concept:labels-selectors",
      "to": "concept:service",
      "rel": "enables",
      "weight": 0.8
    },
    {
      "from": "concept:labels-selectors",
      "to": "concept:replicaset",
      "rel": "enables",
      "weight": 0.8
    },
    {
      "from": "concept:labels-selectors",
      "to": "concept:network-policies",
      "rel": "enables",
      "weight": 0.8
    },
    {
      "from": "concept:pod",
      "to": "concept:probes",
      "rel": "prerequisite",
      "weight": 1.0
    },
    {
      "from": "concept:service",
      "to": "concept:probes",
      "rel": "prerequisite",
      "weight": 1.0
    },
    {
      "from": "concept:probes",
      "to": "concept:rolling-update",
      "rel": "enables",
      "weight": 0.8
    },
    {
      "from": "concept:deployment",
      "to": "concept:rolling-update",
      "rel": "prerequisite",
      "weight": 1.0
    },
    {
      "from": "concept:probes",
      "to": "concept:rolling-update",
      "rel": "prerequisite",
      "weight": 1.0
    },
    {
      "from": "concept:service",
      "to": "concept:rolling-update",
      "rel": "prerequisite",
      "weight": 1.0
    },
    {
      "from": "concept:rolling-update",
      "to": "concept:hpa",
      "rel": "enables",
      "weight": 0.8
    },
    {
      "from": "concept:pod",
      "to": "concept:control-plane",
      "rel": "prerequisite",
      "weight": 1.0
    },
    {
      "from": "concept:deployment",
      "to": "concept:control-plane",
      "rel": "prerequisite",
      "weight": 1.0
    },
    {
      "from": "concept:control-plane",
      "to": "concept:eks-architecture",
      "rel": "enables",
      "weight": 0.8
    },
    {
      "from": "concept:control-plane",
      "to": "concept:upgrade-sequence",
      "rel": "enables",
      "weight": 0.8
    },
    {
      "from": "concept:pod",
      "to": "concept:daemonset",
      "rel": "prerequisite",
      "weight": 1.0
    },
    {
      "from": "concept:node",
      "to": "concept:daemonset",
      "rel": "prerequisite",
      "weight": 1.0
    },
    {
      "from": "concept:daemonset",
      "to": "concept:fluent-bit",
      "rel": "enables",
      "weight": 0.8
    },
    {
      "from": "concept:daemonset",
      "to": "concept:vpc-cni",
      "rel": "enables",
      "weight": 0.8
    },
    {
      "from": "concept:deployment",
      "to": "concept:statefulset",
      "rel": "prerequisite",
      "weight": 1.0
    },
    {
      "from": "concept:pv-pvc",
      "to": "concept:statefulset",
      "rel": "prerequisite",
      "weight": 1.0
    },
    {
      "from": "concept:statefulset",
      "to": "concept:pv-pvc",
      "rel": "enables",
      "weight": 0.8
    },
    {
      "from": "concept:pod",
      "to": "concept:node",
      "rel": "prerequisite",
      "weight": 1.0
    },
    {
      "from": "concept:node",
      "to": "concept:managed-node-groups",
      "rel": "enables",
      "weight": 0.8
    },
    {
      "from": "concept:node",
      "to": "concept:karpenter",
      "rel": "enables",
      "weight": 0.8
    },
    {
      "from": "concept:node",
      "to": "concept:cluster-autoscaler",
      "rel": "enables",
      "weight": 0.8
    },
    {
      "from": "concept:pod",
      "to": "concept:resource-limits",
      "rel": "prerequisite",
      "weight": 1.0
    },
    {
      "from": "concept:node",
      "to": "concept:resource-limits",
      "rel": "prerequisite",
      "weight": 1.0
    },
    {
      "from": "concept:resource-limits",
      "to": "concept:vpa",
      "rel": "enables",
      "weight": 0.8
    },
    {
      "from": "concept:resource-limits",
      "to": "concept:hpa",
      "rel": "enables",
      "weight": 0.8
    },
    {
      "from": "concept:control-plane",
      "to": "concept:eks-architecture",
      "rel": "prerequisite",
      "weight": 1.0
    },
    {
      "from": "concept:eks-architecture",
      "to": "concept:managed-node-groups",
      "rel": "enables",
      "weight": 0.8
    },
    {
      "from": "concept:eks-architecture",
      "to": "concept:fargate-profiles",
      "rel": "enables",
      "weight": 0.8
    },
    {
      "from": "concept:eks-architecture",
      "to": "concept:iam-eks",
      "rel": "enables",
      "weight": 0.8
    },
    {
      "from": "concept:eks-architecture",
      "to": "concept:managed-node-groups",
      "rel": "prerequisite",
      "weight": 1.0
    },
    {
      "from": "concept:node",
      "to": "concept:managed-node-groups",
      "rel": "prerequisite",
      "weight": 1.0
    },
    {
      "from": "concept:managed-node-groups",
      "to": "concept:cluster-autoscaler",
      "rel": "enables",
      "weight": 0.8
    },
    {
      "from": "concept:managed-node-groups",
      "to": "concept:upgrade-sequence",
      "rel": "enables",
      "weight": 0.8
    },
    {
      "from": "concept:eks-architecture",
      "to": "concept:fargate-profiles",
      "rel": "prerequisite",
      "weight": 1.0
    },
    {
      "from": "concept:pod",
      "to": "concept:fargate-profiles",
      "rel": "prerequisite",
      "weight": 1.0
    },
    {
      "from": "concept:fargate-profiles",
      "to": "concept:fargate-logging",
      "rel": "enables",
      "weight": 0.8
    },
    {
      "from": "concept:eks-architecture",
      "to": "concept:eksctl-create",
      "rel": "prerequisite",
      "weight": 1.0
    },
    {
      "from": "concept:eksctl-create",
      "to": "concept:upgrade-sequence",
      "rel": "enables",
      "weight": 0.8
    },
    {
      "from": "concept:eks-architecture",
      "to": "concept:upgrade-sequence",
      "rel": "prerequisite",
      "weight": 1.0
    },
    {
      "from": "concept:managed-node-groups",
      "to": "concept:upgrade-sequence",
      "rel": "prerequisite",
      "weight": 1.0
    },
    {
      "from": "concept:eksctl-create",
      "to": "concept:eks-addons",
      "rel": "prerequisite",
      "weight": 1.0
    },
    {
      "from": "concept:eks-addons",
      "to": "concept:vpc-cni",
      "rel": "enables",
      "weight": 0.8
    },
    {
      "from": "concept:eks-addons",
      "to": "concept:ebs-csi",
      "rel": "enables",
      "weight": 0.8
    },
    {
      "from": "concept:eks-addons",
      "to": "concept:efs-csi",
      "rel": "enables",
      "weight": 0.8
    },
    {
      "from": "concept:container",
      "to": "concept:ecr",
      "rel": "prerequisite",
      "weight": 1.0
    },
    {
      "from": "concept:ecr",
      "to": "concept:helm",
      "rel": "enables",
      "weight": 0.8
    },
    {
      "from": "concept:ecr",
      "to": "concept:image-scanning",
      "rel": "enables",
      "weight": 0.8
    },
    {
      "from": "concept:ecr",
      "to": "concept:image-scanning",
      "rel": "prerequisite",
      "weight": 1.0
    },
    {
      "from": "concept:deployment",
      "to": "concept:helm",
      "rel": "prerequisite",
      "weight": 1.0
    },
    {
      "from": "concept:service",
      "to": "concept:helm",
      "rel": "prerequisite",
      "weight": 1.0
    },
    {
      "from": "concept:deployment",
      "to": "concept:hpa",
      "rel": "prerequisite",
      "weight": 1.0
    },
    {
      "from": "concept:resource-limits",
      "to": "concept:hpa",
      "rel": "prerequisite",
      "weight": 1.0
    },
    {
      "from": "concept:hpa",
      "to": "concept:cluster-autoscaler",
      "rel": "enables",
      "weight": 0.8
    },
    {
      "from": "concept:hpa",
      "to": "concept:karpenter",
      "rel": "enables",
      "weight": 0.8
    },
    {
      "from": "concept:resource-limits",
      "to": "concept:vpa",
      "rel": "prerequisite",
      "weight": 1.0
    },
    {
      "from": "concept:managed-node-groups",
      "to": "concept:cluster-autoscaler",
      "rel": "prerequisite",
      "weight": 1.0
    },
    {
      "from": "concept:hpa",
      "to": "concept:cluster-autoscaler",
      "rel": "prerequisite",
      "weight": 1.0
    },
    {
      "from": "concept:node",
      "to": "concept:karpenter",
      "rel": "prerequisite",
      "weight": 1.0
    },
    {
      "from": "concept:hpa",
      "to": "concept:karpenter",
      "rel": "prerequisite",
      "weight": 1.0
    },
    {
      "from": "concept:deployment",
      "to": "concept:gitops-argocd",
      "rel": "prerequisite",
      "weight": 1.0
    },
    {
      "from": "concept:helm",
      "to": "concept:gitops-argocd",
      "rel": "prerequisite",
      "weight": 1.0
    },
    {
      "from": "concept:eks-architecture",
      "to": "concept:vpc-cni",
      "rel": "prerequisite",
      "weight": 1.0
    },
    {
      "from": "concept:pod",
      "to": "concept:vpc-cni",
      "rel": "prerequisite",
      "weight": 1.0
    },
    {
      "from": "concept:vpc-cni",
      "to": "concept:service-types",
      "rel": "enables",
      "weight": 0.8
    },
    {
      "from": "concept:vpc-cni",
      "to": "concept:network-policies",
      "rel": "enables",
      "weight": 0.8
    },
    {
      "from": "concept:service",
      "to": "concept:service-types",
      "rel": "prerequisite",
      "weight": 1.0
    },
    {
      "from": "concept:vpc-cni",
      "to": "concept:service-types",
      "rel": "prerequisite",
      "weight": 1.0
    },
    {
      "from": "concept:service-types",
      "to": "concept:ingress",
      "rel": "enables",
      "weight": 0.8
    },
    {
      "from": "concept:service-types",
      "to": "concept:ingress",
      "rel": "prerequisite",
      "weight": 1.0
    },
    {
      "from": "concept:vpc-cni",
      "to": "concept:network-policies",
      "rel": "prerequisite",
      "weight": 1.0
    },
    {
      "from": "concept:namespace",
      "to": "concept:network-policies",
      "rel": "prerequisite",
      "weight": 1.0
    },
    {
      "from": "concept:labels-selectors",
      "to": "concept:network-policies",
      "rel": "prerequisite",
      "weight": 1.0
    },
    {
      "from": "concept:service",
      "to": "concept:coredns",
      "rel": "prerequisite",
      "weight": 1.0
    },
    {
      "from": "concept:eks-addons",
      "to": "concept:coredns",
      "rel": "prerequisite",
      "weight": 1.0
    },
    {
      "from": "concept:eks-architecture",
      "to": "concept:three-pillars",
      "rel": "prerequisite",
      "weight": 1.0
    },
    {
      "from": "concept:three-pillars",
      "to": "concept:prometheus",
      "rel": "enables",
      "weight": 0.8
    },
    {
      "from": "concept:three-pillars",
      "to": "concept:fluent-bit",
      "rel": "enables",
      "weight": 0.8
    },
    {
      "from": "concept:three-pillars",
      "to": "concept:xray",
      "rel": "enables",
      "weight": 0.8
    },
    {
      "from": "concept:three-pillars",
      "to": "concept:prometheus",
      "rel": "prerequisite",
      "weight": 1.0
    },
    {
      "from": "concept:three-pillars",
      "to": "concept:cloudwatch-insights",
      "rel": "prerequisite",
      "weight": 1.0
    },
    {
      "from": "concept:daemonset",
      "to": "concept:cloudwatch-insights",
      "rel": "prerequisite",
      "weight": 1.0
    },
    {
      "from": "concept:daemonset",
      "to": "concept:fluent-bit",
      "rel": "prerequisite",
      "weight": 1.0
    },
    {
      "from": "concept:three-pillars",
      "to": "concept:fluent-bit",
      "rel": "prerequisite",
      "weight": 1.0
    },
    {
      "from": "concept:three-pillars",
      "to": "concept:xray",
      "rel": "prerequisite",
      "weight": 1.0
    },
    {
      "from": "concept:pod",
      "to": "concept:pv-pvc",
      "rel": "prerequisite",
      "weight": 1.0
    },
    {
      "from": "concept:pv-pvc",
      "to": "concept:ebs-csi",
      "rel": "enables",
      "weight": 0.8
    },
    {
      "from": "concept:pv-pvc",
      "to": "concept:efs-csi",
      "rel": "enables",
      "weight": 0.8
    },
    {
      "from": "concept:pv-pvc",
      "to": "concept:statefulset",
      "rel": "enables",
      "weight": 0.8
    },
    {
      "from": "concept:pv-pvc",
      "to": "concept:ebs-csi",
      "rel": "prerequisite",
      "weight": 1.0
    },
    {
      "from": "concept:eks-addons",
      "to": "concept:ebs-csi",
      "rel": "prerequisite",
      "weight": 1.0
    },
    {
      "from": "concept:pv-pvc",
      "to": "concept:efs-csi",
      "rel": "prerequisite",
      "weight": 1.0
    },
    {
      "from": "concept:eks-addons",
      "to": "concept:efs-csi",
      "rel": "prerequisite",
      "weight": 1.0
    },
    {
      "from": "concept:secret",
      "to": "concept:ascp",
      "rel": "prerequisite",
      "weight": 1.0
    },
    {
      "from": "concept:irsa",
      "to": "concept:ascp",
      "rel": "prerequisite",
      "weight": 1.0
    },
    {
      "from": "concept:eks-architecture",
      "to": "concept:four-cs",
      "rel": "prerequisite",
      "weight": 1.0
    },
    {
      "from": "concept:four-cs",
      "to": "concept:iam-eks",
      "rel": "enables",
      "weight": 0.8
    },
    {
      "from": "concept:four-cs",
      "to": "concept:rbac",
      "rel": "enables",
      "weight": 0.8
    },
    {
      "from": "concept:four-cs",
      "to": "concept:iam-eks",
      "rel": "prerequisite",
      "weight": 1.0
    },
    {
      "from": "concept:iam-eks",
      "to": "concept:irsa",
      "rel": "enables",
      "weight": 0.8
    },
    {
      "from": "concept:iam-eks",
      "to": "concept:rbac",
      "rel": "enables",
      "weight": 0.8
    },
    {
      "from": "concept:iam-eks",
      "to": "concept:rbac",
      "rel": "prerequisite",
      "weight": 1.0
    },
    {
      "from": "concept:namespace",
      "to": "concept:rbac",
      "rel": "prerequisite",
      "weight": 1.0
    },
    {
      "from": "concept:rbac",
      "to": "concept:irsa",
      "rel": "enables",
      "weight": 0.8
    },
    {
      "from": "concept:rbac",
      "to": "concept:irsa",
      "rel": "prerequisite",
      "weight": 1.0
    },
    {
      "from": "concept:fargate-profiles",
      "to": "concept:irsa",
      "rel": "prerequisite",
      "weight": 1.0
    },
    {
      "from": "concept:irsa",
      "to": "concept:ascp",
      "rel": "enables",
      "weight": 0.8
    },
    {
      "from": "concept:container",
      "to": "page:learn-visually",
      "rel": "covered_by",
      "weight": 1.0
    },
    {
      "from": "concept:container",
      "to": "page:anim-m01",
      "rel": "covered_by",
      "weight": 1.0
    },
    {
      "from": "concept:container",
      "to": "page:lab1-core",
      "rel": "covered_by",
      "weight": 1.0
    },
    {
      "from": "concept:container",
      "to": "page:deep-dive",
      "rel": "covered_by",
      "weight": 1.0
    },
    {
      "from": "concept:container",
      "to": "page:flash-m01",
      "rel": "covered_by",
      "weight": 1.0
    },
    {
      "from": "concept:pod",
      "to": "page:learn-visually",
      "rel": "covered_by",
      "weight": 1.0
    },
    {
      "from": "concept:pod",
      "to": "page:deep-dive",
      "rel": "covered_by",
      "weight": 1.0
    },
    {
      "from": "concept:pod",
      "to": "page:anim-m01",
      "rel": "covered_by",
      "weight": 1.0
    },
    {
      "from": "concept:pod",
      "to": "page:lab1-core",
      "rel": "covered_by",
      "weight": 1.0
    },
    {
      "from": "concept:pod",
      "to": "page:cluster-explained",
      "rel": "covered_by",
      "weight": 1.0
    },
    {
      "from": "concept:pod",
      "to": "page:flash-m01",
      "rel": "covered_by",
      "weight": 1.0
    },
    {
      "from": "concept:replicaset",
      "to": "page:learn-visually",
      "rel": "covered_by",
      "weight": 1.0
    },
    {
      "from": "concept:replicaset",
      "to": "page:anim-m01",
      "rel": "covered_by",
      "weight": 1.0
    },
    {
      "from": "concept:replicaset",
      "to": "page:lab1-core",
      "rel": "covered_by",
      "weight": 1.0
    },
    {
      "from": "concept:replicaset",
      "to": "page:flash-m01",
      "rel": "covered_by",
      "weight": 1.0
    },
    {
      "from": "concept:deployment",
      "to": "page:learn-visually",
      "rel": "covered_by",
      "weight": 1.0
    },
    {
      "from": "concept:deployment",
      "to": "page:deep-dive",
      "rel": "covered_by",
      "weight": 1.0
    },
    {
      "from": "concept:deployment",
      "to": "page:anim-m01",
      "rel": "covered_by",
      "weight": 1.0
    },
    {
      "from": "concept:deployment",
      "to": "page:lab1-core",
      "rel": "covered_by",
      "weight": 1.0
    },
    {
      "from": "concept:deployment",
      "to": "page:cluster-explained",
      "rel": "covered_by",
      "weight": 1.0
    },
    {
      "from": "concept:deployment",
      "to": "page:flash-m01",
      "rel": "covered_by",
      "weight": 1.0
    },
    {
      "from": "concept:service",
      "to": "page:learn-visually",
      "rel": "covered_by",
      "weight": 1.0
    },
    {
      "from": "concept:service",
      "to": "page:deep-dive",
      "rel": "covered_by",
      "weight": 1.0
    },
    {
      "from": "concept:service",
      "to": "page:anim-m01",
      "rel": "covered_by",
      "weight": 1.0
    },
    {
      "from": "concept:service",
      "to": "page:lab1-core",
      "rel": "covered_by",
      "weight": 1.0
    },
    {
      "from": "concept:service",
      "to": "page:cluster-explained",
      "rel": "covered_by",
      "weight": 1.0
    },
    {
      "from": "concept:service",
      "to": "page:flash-m01",
      "rel": "covered_by",
      "weight": 1.0
    },
    {
      "from": "concept:namespace",
      "to": "page:learn-visually",
      "rel": "covered_by",
      "weight": 1.0
    },
    {
      "from": "concept:namespace",
      "to": "page:deep-dive",
      "rel": "covered_by",
      "weight": 1.0
    },
    {
      "from": "concept:namespace",
      "to": "page:anim-m01",
      "rel": "covered_by",
      "weight": 1.0
    },
    {
      "from": "concept:namespace",
      "to": "page:cluster-explained",
      "rel": "covered_by",
      "weight": 1.0
    },
    {
      "from": "concept:namespace",
      "to": "page:flash-m01",
      "rel": "covered_by",
      "weight": 1.0
    },
    {
      "from": "concept:configmap",
      "to": "page:deep-dive",
      "rel": "covered_by",
      "weight": 1.0
    },
    {
      "from": "concept:configmap",
      "to": "page:anim-m01",
      "rel": "covered_by",
      "weight": 1.0
    },
    {
      "from": "concept:configmap",
      "to": "page:flash-m01",
      "rel": "covered_by",
      "weight": 1.0
    },
    {
      "from": "concept:secret",
      "to": "page:deep-dive",
      "rel": "covered_by",
      "weight": 1.0
    },
    {
      "from": "concept:secret",
      "to": "page:cluster-explained",
      "rel": "covered_by",
      "weight": 1.0
    },
    {
      "from": "concept:secret",
      "to": "page:anim-m01",
      "rel": "covered_by",
      "weight": 1.0
    },
    {
      "from": "concept:secret",
      "to": "page:flash-m01",
      "rel": "covered_by",
      "weight": 1.0
    },
    {
      "from": "concept:labels-selectors",
      "to": "page:learn-visually",
      "rel": "covered_by",
      "weight": 1.0
    },
    {
      "from": "concept:labels-selectors",
      "to": "page:anim-m01",
      "rel": "covered_by",
      "weight": 1.0
    },
    {
      "from": "concept:labels-selectors",
      "to": "page:flash-m01",
      "rel": "covered_by",
      "weight": 1.0
    },
    {
      "from": "concept:probes",
      "to": "page:learn-visually",
      "rel": "covered_by",
      "weight": 1.0
    },
    {
      "from": "concept:probes",
      "to": "page:anim-m01",
      "rel": "covered_by",
      "weight": 1.0
    },
    {
      "from": "concept:probes",
      "to": "page:lab1-core",
      "rel": "covered_by",
      "weight": 1.0
    },
    {
      "from": "concept:probes",
      "to": "page:flash-m01",
      "rel": "covered_by",
      "weight": 1.0
    },
    {
      "from": "concept:rolling-update",
      "to": "page:learn-visually",
      "rel": "covered_by",
      "weight": 1.0
    },
    {
      "from": "concept:rolling-update",
      "to": "page:visual-concepts",
      "rel": "covered_by",
      "weight": 1.0
    },
    {
      "from": "concept:rolling-update",
      "to": "page:anim-m01",
      "rel": "covered_by",
      "weight": 1.0
    },
    {
      "from": "concept:rolling-update",
      "to": "page:lab1-core",
      "rel": "covered_by",
      "weight": 1.0
    },
    {
      "from": "concept:rolling-update",
      "to": "page:flash-m01",
      "rel": "covered_by",
      "weight": 1.0
    },
    {
      "from": "concept:control-plane",
      "to": "page:deep-dive",
      "rel": "covered_by",
      "weight": 1.0
    },
    {
      "from": "concept:control-plane",
      "to": "page:cluster-explained",
      "rel": "covered_by",
      "weight": 1.0
    },
    {
      "from": "concept:control-plane",
      "to": "page:anim-m01",
      "rel": "covered_by",
      "weight": 1.0
    },
    {
      "from": "concept:control-plane",
      "to": "page:flash-m01",
      "rel": "covered_by",
      "weight": 1.0
    },
    {
      "from": "concept:daemonset",
      "to": "page:deep-dive",
      "rel": "covered_by",
      "weight": 1.0
    },
    {
      "from": "concept:daemonset",
      "to": "page:visual-concepts",
      "rel": "covered_by",
      "weight": 1.0
    },
    {
      "from": "concept:daemonset",
      "to": "page:flash-m01",
      "rel": "covered_by",
      "weight": 1.0
    },
    {
      "from": "concept:statefulset",
      "to": "page:deep-dive",
      "rel": "covered_by",
      "weight": 1.0
    },
    {
      "from": "concept:statefulset",
      "to": "page:visual-concepts",
      "rel": "covered_by",
      "weight": 1.0
    },
    {
      "from": "concept:statefulset",
      "to": "page:anim-m08",
      "rel": "covered_by",
      "weight": 1.0
    },
    {
      "from": "concept:statefulset",
      "to": "page:flash-m01",
      "rel": "covered_by",
      "weight": 1.0
    },
    {
      "from": "concept:statefulset",
      "to": "page:flash-m08",
      "rel": "covered_by",
      "weight": 1.0
    },
    {
      "from": "concept:node",
      "to": "page:deep-dive",
      "rel": "covered_by",
      "weight": 1.0
    },
    {
      "from": "concept:node",
      "to": "page:cluster-explained",
      "rel": "covered_by",
      "weight": 1.0
    },
    {
      "from": "concept:node",
      "to": "page:flash-m01",
      "rel": "covered_by",
      "weight": 1.0
    },
    {
      "from": "concept:resource-limits",
      "to": "page:deep-dive",
      "rel": "covered_by",
      "weight": 1.0
    },
    {
      "from": "concept:resource-limits",
      "to": "page:anim-m01",
      "rel": "covered_by",
      "weight": 1.0
    },
    {
      "from": "concept:resource-limits",
      "to": "page:flash-m01",
      "rel": "covered_by",
      "weight": 1.0
    },
    {
      "from": "concept:eks-architecture",
      "to": "page:lab1-aws",
      "rel": "covered_by",
      "weight": 1.0
    },
    {
      "from": "concept:eks-architecture",
      "to": "page:anim-m02",
      "rel": "covered_by",
      "weight": 1.0
    },
    {
      "from": "concept:eks-architecture",
      "to": "page:flash-m02",
      "rel": "covered_by",
      "weight": 1.0
    },
    {
      "from": "concept:managed-node-groups",
      "to": "page:anim-m02",
      "rel": "covered_by",
      "weight": 1.0
    },
    {
      "from": "concept:managed-node-groups",
      "to": "page:anim-m03",
      "rel": "covered_by",
      "weight": 1.0
    },
    {
      "from": "concept:managed-node-groups",
      "to": "page:flash-m02",
      "rel": "covered_by",
      "weight": 1.0
    },
    {
      "from": "concept:fargate-profiles",
      "to": "page:anim-m02",
      "rel": "covered_by",
      "weight": 1.0
    },
    {
      "from": "concept:fargate-profiles",
      "to": "page:flash-m02",
      "rel": "covered_by",
      "weight": 1.0
    },
    {
      "from": "concept:eksctl-create",
      "to": "page:anim-m03",
      "rel": "covered_by",
      "weight": 1.0
    },
    {
      "from": "concept:eksctl-create",
      "to": "page:flash-m03",
      "rel": "covered_by",
      "weight": 1.0
    },
    {
      "from": "concept:upgrade-sequence",
      "to": "page:anim-m03",
      "rel": "covered_by",
      "weight": 1.0
    },
    {
      "from": "concept:upgrade-sequence",
      "to": "page:flash-m03",
      "rel": "covered_by",
      "weight": 1.0
    },
    {
      "from": "concept:eks-addons",
      "to": "page:anim-m03",
      "rel": "covered_by",
      "weight": 1.0
    },
    {
      "from": "concept:eks-addons",
      "to": "page:flash-m03",
      "rel": "covered_by",
      "weight": 1.0
    },
    {
      "from": "concept:ecr",
      "to": "page:anim-m04",
      "rel": "covered_by",
      "weight": 1.0
    },
    {
      "from": "concept:ecr",
      "to": "page:flash-m04",
      "rel": "covered_by",
      "weight": 1.0
    },
    {
      "from": "concept:image-scanning",
      "to": "page:anim-m04",
      "rel": "covered_by",
      "weight": 1.0
    },
    {
      "from": "concept:image-scanning",
      "to": "page:flash-m04",
      "rel": "covered_by",
      "weight": 1.0
    },
    {
      "from": "concept:helm",
      "to": "page:anim-m04",
      "rel": "covered_by",
      "weight": 1.0
    },
    {
      "from": "concept:helm",
      "to": "page:flash-m04",
      "rel": "covered_by",
      "weight": 1.0
    },
    {
      "from": "concept:hpa",
      "to": "page:anim-m05",
      "rel": "covered_by",
      "weight": 1.0
    },
    {
      "from": "concept:hpa",
      "to": "page:flash-m05",
      "rel": "covered_by",
      "weight": 1.0
    },
    {
      "from": "concept:vpa",
      "to": "page:anim-m05",
      "rel": "covered_by",
      "weight": 1.0
    },
    {
      "from": "concept:vpa",
      "to": "page:flash-m05",
      "rel": "covered_by",
      "weight": 1.0
    },
    {
      "from": "concept:cluster-autoscaler",
      "to": "page:anim-m05",
      "rel": "covered_by",
      "weight": 1.0
    },
    {
      "from": "concept:cluster-autoscaler",
      "to": "page:flash-m05",
      "rel": "covered_by",
      "weight": 1.0
    },
    {
      "from": "concept:karpenter",
      "to": "page:anim-m05",
      "rel": "covered_by",
      "weight": 1.0
    },
    {
      "from": "concept:karpenter",
      "to": "page:flash-m05",
      "rel": "covered_by",
      "weight": 1.0
    },
    {
      "from": "concept:gitops-argocd",
      "to": "page:anim-m05",
      "rel": "covered_by",
      "weight": 1.0
    },
    {
      "from": "concept:gitops-argocd",
      "to": "page:flash-m05",
      "rel": "covered_by",
      "weight": 1.0
    },
    {
      "from": "concept:vpc-cni",
      "to": "page:anim-m06",
      "rel": "covered_by",
      "weight": 1.0
    },
    {
      "from": "concept:vpc-cni",
      "to": "page:flash-m06",
      "rel": "covered_by",
      "weight": 1.0
    },
    {
      "from": "concept:service-types",
      "to": "page:deep-dive",
      "rel": "covered_by",
      "weight": 1.0
    },
    {
      "from": "concept:service-types",
      "to": "page:anim-m06",
      "rel": "covered_by",
      "weight": 1.0
    },
    {
      "from": "concept:service-types",
      "to": "page:flash-m06",
      "rel": "covered_by",
      "weight": 1.0
    },
    {
      "from": "concept:ingress",
      "to": "page:anim-m06",
      "rel": "covered_by",
      "weight": 1.0
    },
    {
      "from": "concept:ingress",
      "to": "page:flash-m06",
      "rel": "covered_by",
      "weight": 1.0
    },
    {
      "from": "concept:network-policies",
      "to": "page:anim-m06",
      "rel": "covered_by",
      "weight": 1.0
    },
    {
      "from": "concept:network-policies",
      "to": "page:flash-m06",
      "rel": "covered_by",
      "weight": 1.0
    },
    {
      "from": "concept:coredns",
      "to": "page:anim-m06",
      "rel": "covered_by",
      "weight": 1.0
    },
    {
      "from": "concept:coredns",
      "to": "page:flash-m06",
      "rel": "covered_by",
      "weight": 1.0
    },
    {
      "from": "concept:three-pillars",
      "to": "page:anim-m07",
      "rel": "covered_by",
      "weight": 1.0
    },
    {
      "from": "concept:three-pillars",
      "to": "page:flash-m07",
      "rel": "covered_by",
      "weight": 1.0
    },
    {
      "from": "concept:prometheus",
      "to": "page:anim-m07",
      "rel": "covered_by",
      "weight": 1.0
    },
    {
      "from": "concept:prometheus",
      "to": "page:flash-m07",
      "rel": "covered_by",
      "weight": 1.0
    },
    {
      "from": "concept:cloudwatch-insights",
      "to": "page:anim-m07",
      "rel": "covered_by",
      "weight": 1.0
    },
    {
      "from": "concept:cloudwatch-insights",
      "to": "page:flash-m07",
      "rel": "covered_by",
      "weight": 1.0
    },
    {
      "from": "concept:fluent-bit",
      "to": "page:anim-m07",
      "rel": "covered_by",
      "weight": 1.0
    },
    {
      "from": "concept:fluent-bit",
      "to": "page:flash-m07",
      "rel": "covered_by",
      "weight": 1.0
    },
    {
      "from": "concept:xray",
      "to": "page:anim-m07",
      "rel": "covered_by",
      "weight": 1.0
    },
    {
      "from": "concept:xray",
      "to": "page:flash-m07",
      "rel": "covered_by",
      "weight": 1.0
    },
    {
      "from": "concept:pv-pvc",
      "to": "page:deep-dive",
      "rel": "covered_by",
      "weight": 1.0
    },
    {
      "from": "concept:pv-pvc",
      "to": "page:anim-m08",
      "rel": "covered_by",
      "weight": 1.0
    },
    {
      "from": "concept:pv-pvc",
      "to": "page:flash-m08",
      "rel": "covered_by",
      "weight": 1.0
    },
    {
      "from": "concept:ebs-csi",
      "to": "page:anim-m08",
      "rel": "covered_by",
      "weight": 1.0
    },
    {
      "from": "concept:ebs-csi",
      "to": "page:flash-m08",
      "rel": "covered_by",
      "weight": 1.0
    },
    {
      "from": "concept:efs-csi",
      "to": "page:anim-m08",
      "rel": "covered_by",
      "weight": 1.0
    },
    {
      "from": "concept:efs-csi",
      "to": "page:flash-m08",
      "rel": "covered_by",
      "weight": 1.0
    },
    {
      "from": "concept:ascp",
      "to": "page:anim-m08",
      "rel": "covered_by",
      "weight": 1.0
    },
    {
      "from": "concept:ascp",
      "to": "page:flash-m08",
      "rel": "covered_by",
      "weight": 1.0
    },
    {
      "from": "concept:four-cs",
      "to": "page:anim-m09",
      "rel": "covered_by",
      "weight": 1.0
    },
    {
      "from": "concept:four-cs",
      "to": "page:flash-m09",
      "rel": "covered_by",
      "weight": 1.0
    },
    {
      "from": "concept:iam-eks",
      "to": "page:anim-m09",
      "rel": "covered_by",
      "weight": 1.0
    },
    {
      "from": "concept:iam-eks",
      "to": "page:flash-m09",
      "rel": "covered_by",
      "weight": 1.0
    },
    {
      "from": "concept:rbac",
      "to": "page:anim-m09",
      "rel": "covered_by",
      "weight": 1.0
    },
    {
      "from": "concept:rbac",
      "to": "page:flash-m09",
      "rel": "covered_by",
      "weight": 1.0
    },
    {
      "from": "concept:irsa",
      "to": "page:anim-m09",
      "rel": "covered_by",
      "weight": 1.0
    },
    {
      "from": "concept:irsa",
      "to": "page:anim-m08",
      "rel": "covered_by",
      "weight": 1.0
    },
    {
      "from": "concept:irsa",
      "to": "page:flash-m09",
      "rel": "covered_by",
      "weight": 1.0
    },
    {
      "from": "m01",
      "to": "page:anim-m01",
      "rel": "contains"
    },
    {
      "from": "m01",
      "to": "page:flash-m01",
      "rel": "contains"
    },
    {
      "from": "m01",
      "to": "page:lab1-core",
      "rel": "contains"
    },
    {
      "from": "m02",
      "to": "page:anim-m02",
      "rel": "contains"
    },
    {
      "from": "m02",
      "to": "page:flash-m02",
      "rel": "contains"
    },
    {
      "from": "m02",
      "to": "page:lab1-aws",
      "rel": "contains"
    },
    {
      "from": "m03",
      "to": "page:anim-m03",
      "rel": "contains"
    },
    {
      "from": "m03",
      "to": "page:flash-m03",
      "rel": "contains"
    },
    {
      "from": "m04",
      "to": "page:anim-m04",
      "rel": "contains"
    },
    {
      "from": "m04",
      "to": "page:flash-m04",
      "rel": "contains"
    },
    {
      "from": "m05",
      "to": "page:anim-m05",
      "rel": "contains"
    },
    {
      "from": "m05",
      "to": "page:flash-m05",
      "rel": "contains"
    },
    {
      "from": "m06",
      "to": "page:anim-m06",
      "rel": "contains"
    },
    {
      "from": "m06",
      "to": "page:flash-m06",
      "rel": "contains"
    },
    {
      "from": "m07",
      "to": "page:anim-m07",
      "rel": "contains"
    },
    {
      "from": "m07",
      "to": "page:flash-m07",
      "rel": "contains"
    },
    {
      "from": "m08",
      "to": "page:anim-m08",
      "rel": "contains"
    },
    {
      "from": "m08",
      "to": "page:flash-m08",
      "rel": "contains"
    },
    {
      "from": "m09",
      "to": "page:anim-m09",
      "rel": "contains"
    },
    {
      "from": "m09",
      "to": "page:flash-m09",
      "rel": "contains"
    }
  ]
};

// ── Lookup helpers ──────────────────────────────────────────────────────

const conceptById = new Map(content_graph.concepts.map((c) => [c.id, c]));
const pageById    = new Map(content_graph.pages.map((p) => [p.id, p]));
const moduleById  = new Map(content_graph.modules.map((m) => [m.id, m]));

export function getConcept(id: string): EksConcept | undefined { return conceptById.get(id); }
export function getPage(id: string): EksPage | undefined { return pageById.get(id); }
export function getModule(id: string): EksModule | undefined { return moduleById.get(id); }

/** Return concepts in a given module, ordered by their `order` field. */
export function conceptsInModule(moduleId: string): EksConcept[] {
  return content_graph.concepts
    .filter((c) => c.module === moduleId)
    .sort((a, b) => a.order - b.order);
}

/** Module ids that contain the direct prerequisites of a concept. */
export function prerequisiteModules(conceptId: string): string[] {
  const c = conceptById.get(conceptId);
  if (!c) return [];
  return Array.from(new Set(
    c.prerequisites
      .map((pid) => conceptById.get(pid))
      .filter((p): p is EksConcept => Boolean(p))
      .map((p) => p.module),
  ));
}

/** Pages that cover the concepts enabled by this concept — "what to read next". */
export function nextPages(conceptId: string, limit = 3): Array<{ id: string; title: string; url: string }> {
  const c = conceptById.get(conceptId);
  if (!c) return [];
  return c.enables
    .flatMap((eid) => {
      const ec = conceptById.get(eid);
      return ec ? ec.pages.slice(0, 1) : [];
    })
    .slice(0, limit)
    .map((pid) => pageById.get(pid))
    .filter((p): p is EksPage => Boolean(p))
    .map((p) => ({ id: p.id, title: p.title, url: p.url }));
}

/** Topological order of all concepts (Kahn) — beginner → advanced learning path. */
export function topologicalConcepts(): EksConcept[] {
  const indeg = new Map<string, number>();
  for (const c of content_graph.concepts) indeg.set(c.id, c.prerequisites.length);
  const queue = content_graph.concepts
    .filter((c) => (indeg.get(c.id) ?? 0) === 0)
    .sort((a, b) => a.order - b.order);
  const out: EksConcept[] = [];
  while (queue.length) {
    const c = queue.shift()!;
    out.push(c);
    for (const eid of c.enables) {
      const ec = conceptById.get(eid);
      if (!ec) continue;
      indeg.set(ec.id, (indeg.get(ec.id) ?? 1) - 1);
      if ((indeg.get(ec.id) ?? 0) === 0) {
        // insertion sort by order
        let i = 0;
        while (i < queue.length && queue[i].order < ec.order) i++;
        queue.splice(i, 0, ec);
      }
    }
  }
  return out;
}

/** Build a learning path starting from a target concept — its prerequisite closure in topological order. */
export function pathToConcept(targetId: string): EksConcept[] {
  const target = conceptById.get(targetId);
  if (!target) return [];
  const required = new Set<string>([targetId]);
  const stack = [targetId];
  while (stack.length) {
    const id = stack.pop()!;
    const c = conceptById.get(id);
    if (!c) continue;
    for (const pid of c.prerequisites) {
      if (!required.has(pid)) { required.add(pid); stack.push(pid); }
    }
  }
  return topologicalConcepts().filter((c) => required.has(c.id));
}
