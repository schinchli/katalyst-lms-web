#!/usr/bin/env python3
"""
Assemble the generated per-module JSON into the three TypeScript data files the
Katalyst LMS consumes:
  apps/web/src/data/sec-eng-aws-questions.ts
  apps/web/src/data/sec-eng-aws-flashcards.ts
  apps/web/src/data/sec-eng-aws-notes.ts

String fields are emitted via json.dumps -> valid double-quoted TS strings (safe escaping).
Diagram slugs are attached to matching note sections (keyword rules); only slugs whose
PNG exists in diagrams/png/ are referenced.
"""
import json
from pathlib import Path

HERE = Path(__file__).parent
EXTRACT = Path("/Users/schinchli/Documents/Training Material /Security Engineering on AWS/_extracted")
GEN = EXTRACT / "generated"
WEB_DATA = Path("/Users/schinchli/Documents/Projects/lms/apps/web/src/data")
PNG_DIR = HERE / "diagrams" / "png"

MODULE_ORDER = ["sec-eng-m01", "sec-eng-m02", "sec-eng-m03", "sec-eng-m04",
                "sec-eng-m05", "sec-eng-m06", "sec-eng-m07", "sec-eng-m08"]
COLORS = ["#DD344C", "#C7263E", "#E7157B", "#8C4FFF", "#7AA116", "#1B8D46", "#FF9900", "#CD2264"]
ICONS = ["🛡️", "🔑", "🏢", "🤫", "🔒", "🌐", "📊", "🚨"]

# slug -> caption (from curation); attach to a section if heading/body contains a keyword
DIAGRAM_RULES = {
    "sec-eng-m02": [
        (["assumerole", "cross-account", "cross account"], "m02-cross-account-assumerole",
         "Cross-account access: John creates a role, Maria assumes it via AWS STS to reach the S3 bucket."),
        (["roles anywhere", "x.509", "pki", "certificate"], "m02-iam-roles-anywhere-pki",
         "IAM Roles Anywhere uses PKI and an X.509 certificate trusted by a trust anchor."),
        (["authorization", "evaluation", "allow", "deny", "policy evaluation"], "m02-iam-authorization-flow",
         "How IAM authorizes a request: authentication, applicable policies, actions, resources, and the allow/deny decision."),
        (["permissions boundary", "boundary"], "m02-permissions-boundary-effective",
         "Effective permissions are the intersection of the identity policy and the permissions boundary."),
    ],
    "sec-eng-m03": [
        (["organizations", "scp", "service control", "organizational unit", "ou"],
         "m03-organizations-ou-scp-inheritance",
         "AWS Organizations: SCPs attached to OUs are inherited by nested OUs and member accounts."),
        (["control tower", "landing zone"], "m03-control-tower-landing-zone",
         "AWS Control Tower sets up a governed landing zone over Organizations and IAM Identity Center."),
        (["identity center", "single sign", "sso", "permission set", "active directory", "ad connector"],
         "m03-identity-center-ad-connector",
         "IAM Identity Center connects corporate AD (via AD Connector) to AWS accounts and applications."),
        (["federation", "saml", "oidc", "identity provider", "idp"], "m03-federation-saml-oidc-trust",
         "Federated trust lets an external IdP authenticate users into AWS via SAML/OIDC."),
        (["cognito", "identity pool", "web identity"], "m03-cognito-identity-pool-sts",
         "Amazon Cognito identity pools exchange a verified identity for temporary AWS credentials via STS."),
    ],
    "sec-eng-m01": [
        (["shared responsibility"], "m01-shared-responsibility-ec2",
         "AWS shared responsibility model for Amazon EC2 - what AWS secures versus what the customer secures."),
        (["threat model"], "m01-threat-modeling-process", "The AWS threat modeling process."),
        (["security in the aws", "challenge"], "m01-data-flow-diagram",
         "Example data-flow diagram with trust boundaries used in threat modeling."),
    ],
    "sec-eng-m04": [
        (["envelope encryption"], "m04-envelope-encryption",
         "Envelope encryption in AWS: a data key protected by a KMS key."),
        (["kms key types", "key types"], "m04-kms-ebs", "Encrypting an Amazon EBS volume with AWS KMS."),
        (["aws kms overview", "kms overview"], "m04-kms-architecture-example", "An AWS KMS architecture example."),
        (["key management", "challenge of key"], "m04-cloudhsm", "Using AWS CloudHSM for dedicated key storage."),
        (["secrets manager"], "m04-secrets-manager", "Retrieving and rotating secrets with AWS Secrets Manager."),
    ],
    "sec-eng-m05": [
        (["encryption options"], "m05-sse-kms", "Amazon S3 server-side encryption with AWS KMS."),
        (["s3 security", "amazon s3 security"], "m05-s3-access-points",
         "Controlling bucket access using Amazon S3 access points."),
        (["macie", "discovering sensitive", "monitoring and reporting"], "m05-detect-unintended-access",
         "Detecting unintended access to data."),
        (["encryption by default", "data protection"], "m05-dynamodb-sse",
         "Server-side encryption for Amazon DynamoDB."),
    ],
    "sec-eng-m06": [
        (["network firewall"], "m06-network-firewall", "AWS Network Firewall protecting a VPC."),
        (["vpc peering and security", "vpc peering"], "m06-vpc-peering", "VPC peering between two VPCs."),
        (["security features", "security groups"], "m06-vpc-endpoint",
         "Reaching an AWS service privately via a VPC endpoint."),
        (["inter-region"], "m06-edge-routing-vpn", "Edge-to-edge routing through a VPN connection."),
    ],
    "sec-eng-m07": [
        (["importance of security monitoring", "security monitoring"], "m07-security-monitoring-arch",
         "A security monitoring architecture on AWS."),
        (["defining a baseline", "creating a baseline"], "m07-vpc-flow-logs-cloudwatch",
         "Publishing VPC Flow Logs to Amazon CloudWatch Logs."),
        (["config for continuous", "aws config for"], "m07-athena-integration",
         "Automated log analysis with Amazon Athena."),
        (["config rules"], "m07-opensearch-workflow",
         "Log analytics workflow with Amazon OpenSearch Service."),
    ],
    "sec-eng-m08": [
        (["incident response workflows"], "m08-incident-response-workflow", "Incident response workflow phases."),
        (["incident response in the cloud"], "m08-security-hub-integration",
         "AWS Security Hub integration and findings flow."),
        (["preparation for incident"], "m08-automated-response-arch",
         "Automated response and remediation with Security Hub, EventBridge, and Lambda."),
        (["types of security incidents"], "m08-infected-instance-isolation",
         "Isolating a compromised EC2 instance for forensics."),
        (["indicators of potential"], "m08-forensics-orchestrator",
         "Automated Forensics Orchestrator for Amazon EC2."),
    ],
}


def js(v):
    return json.dumps(v, ensure_ascii=False)


_DIFF = {"easy": "beginner", "basic": "beginner", "beginner": "beginner",
         "medium": "intermediate", "moderate": "intermediate", "intermediate": "intermediate",
         "hard": "advanced", "difficult": "advanced", "advanced": "advanced"}


def norm_diff(d):
    return _DIFF.get(str(d).strip().lower(), "intermediate")


def load(mid):
    return json.load(open(GEN / f"{mid}.json"))


def png_exists(slug):
    return (PNG_DIR / f"{slug}.png").exists()


def attach_diagrams(mid, sections):
    rules = DIAGRAM_RULES.get(mid, [])
    used = set()
    for kws, slug, caption in rules:
        if slug in used or not png_exists(slug):
            continue
        for sec in sections:
            if sec.get("diagram"):
                continue
            hay = (sec.get("heading", "") + " " + sec.get("body", "")).lower()
            if any(k in hay for k in kws):
                sec["diagram"] = slug
                sec["diagramCaption"] = caption
                used.add(slug)
                break
    # any unused-but-existing slug -> attach to first diagram-less section
    for kws, slug, caption in rules:
        if slug in used or not png_exists(slug):
            continue
        for sec in sections:
            if not sec.get("diagram"):
                sec["diagram"] = slug
                sec["diagramCaption"] = caption
                used.add(slug)
                break
    return sections


# ---------------- questions ----------------
def build_questions():
    lines = ["import type { Question } from '@/types';", "",
             "// Auto-generated from Security Engineering on AWS courseware (PPTX -> RAG -> grounded LLM).",
             ""]
    export_names = []
    all_combined = []
    for mid in MODULE_ORDER:
        d = load(mid)
        n = mid.split("-m")[1]
        var = f"secEngM{n}Questions"
        export_names.append(var)
        lines.append(f"export const {var}: Question[] = [")
        for i, q in enumerate(d["quiz"], 1):
            opts = q["options"][:4]
            ids = ["a", "b", "c", "d"][:len(opts)]
            correct = ids[q["correctIndex"]] if 0 <= q["correctIndex"] < len(ids) else "a"
            qid = f"seceng-m{n}-q{i}"
            all_combined.append(qid)
            opt_str = ", ".join("{ id: " + js(oid) + ", text: " + js(ot) + " }" for oid, ot in zip(ids, opts))
            lines.append("  {")
            lines.append(f"    id: {js(qid)},")
            lines.append(f"    text: {js(q['text'])},")
            lines.append(f"    options: [{opt_str}],")
            lines.append(f"    correctOptionId: {js(correct)},")
            lines.append(f"    explanation: {js(q.get('explanation',''))},")
            lines.append(f"    difficulty: {js(norm_diff(q.get('difficulty','intermediate')))},")
            lines.append(f"    category: \"sec-eng-aws\",")
            lines.append(f"    quizId: {js('sec-eng-aws-m'+n)},")
            lines.append("  },")
        lines.append("];")
        lines.append("")
    # full exam = all module questions combined
    lines.append("export const secEngFullExamQuestions: Question[] = [")
    lines.append("  " + ", ".join(f"...{v}" for v in export_names) + ",")
    lines.append("];")
    lines.append("")
    (WEB_DATA / "sec-eng-aws-questions.ts").write_text("\n".join(lines))
    return export_names


# ---------------- flashcards ----------------
def build_flashcards():
    lines = ["import type { FlashcardDeck } from './flashcards';", "",
             "// Auto-generated from Security Engineering on AWS courseware.",
             "",
             "export const secEngAwsFlashcardDecks: FlashcardDeck[] = ["]
    for idx, mid in enumerate(MODULE_ORDER):
        d = load(mid)
        n = mid.split("-m")[1]
        cards = d["flashcards"]
        lines.append("  {")
        lines.append(f"    id: {js(mid)},")
        lines.append(f"    title: {js('Module ' + n + ': ' + d['title'])},")
        lines.append(f"    description: {js(d.get('subtitle',''))},")
        lines.append(f"    category: \"sec-eng-aws\",")
        lines.append(f"    cardCount: {len(cards)},")
        lines.append(f"    color: {js(COLORS[idx])},")
        lines.append(f"    icon: {js(ICONS[idx])},")
        lines.append("    cards: [")
        for j, c in enumerate(cards, 1):
            lines.append("      { id: " + js(f"{mid}-c{j}") + ", front: " + js(c["front"]) + ", back: " + js(c["back"]) + " },")
        lines.append("    ],")
        lines.append("  },")
    lines.append("];")
    lines.append("")
    (WEB_DATA / "sec-eng-aws-flashcards.ts").write_text("\n".join(lines))


# ---------------- notes ----------------
def build_notes():
    lines = ["import type { ModuleNotes } from './moduleNotes';", "",
             "// Auto-generated from Security Engineering on AWS courseware. Diagrams in",
             "// public/sec-eng-aws/notes/ (web) and mobile/assets/images/sec-eng-aws/notes/ (mobile).",
             "",
             "export const SEC_ENG_AWS_NOTES: Record<string, ModuleNotes> = {"]
    for mid in MODULE_ORDER:
        d = load(mid)
        sections = attach_diagrams(mid, d["sections"])
        lines.append(f"  {js(mid)}: {{")
        lines.append(f"    moduleId: {js(mid)},")
        lines.append(f"    title: {js(d['title'])},")
        lines.append(f"    subtitle: {js(d.get('subtitle',''))},")
        lines.append(f"    readingMinutes: {int(d.get('readingMinutes',15))},")
        lines.append(f"    intro: {js(d.get('intro',''))},")
        lines.append("    sections: [")
        for sec in sections:
            lines.append("      {")
            lines.append(f"        heading: {js(sec['heading'])},")
            lines.append(f"        body: {js(sec['body'])},")
            if sec.get("diagram"):
                lines.append(f"        diagram: {js(sec['diagram'])},")
                lines.append(f"        diagramCaption: {js(sec.get('diagramCaption',''))},")
            kps = sec.get("keyPoints") or []
            if kps:
                lines.append("        keyPoints: [" + ", ".join(js(k) for k in kps) + "],")
            lines.append("      },")
        lines.append("    ],")
        tips = d.get("examTips") or []
        lines.append("    examTips: [" + ", ".join(js(t) for t in tips) + "],")
        lines.append("  },")
    lines.append("};")
    lines.append("")
    (WEB_DATA / "sec-eng-aws-notes.ts").write_text("\n".join(lines))


def main():
    missing = [m for m in MODULE_ORDER if not (GEN / f"{m}.json").exists()]
    if missing:
        print("MISSING generated JSON for:", missing)
        return
    names = build_questions()
    build_flashcards()
    build_notes()
    print("Wrote 3 TS files to", WEB_DATA)
    print("question exports:", names)


if __name__ == "__main__":
    main()
