export interface KnowledgeBase {
    companyInfo: {
        name: string;
        tagline: string;
        coreOffering: string;
        expertise: string[];
        methodology: string;
        successStories: string[];
        technicalStack: string[];
    };
    products: {
        [productName: string]: {
            description: string;
            modules: string[];
            outcomes: string[];
            timeline: string;
            pricing: {
                tiers: Array<{
                    name: string;
                    includes: string;
                    investment: string;
                }>;
                ongoing: string;
            };
        };
    };
    proposalTemplates: {
        executiveSummary: string;
        solutionFramework: string;
        implementationApproach: string;
        valueProposition: string;
    };
    industryInsights: {
        [niche: string]: {
            commonBottlenecks: string[];
            bestPractices: string[];
            successMetrics: string[];
        };
    };
    implementationStandards: {
        sovereignty: string;
        paymentStructure: string;
        qualityGates: string[];
        deliveryApproach: string;
    };
}

export const defaultKnowledgeBase: KnowledgeBase = {
    companyInfo: {
        name: "FlowStackOS",
        tagline: "From traffic to retained clients, automated.",
        coreOffering: "Install a Revenue Ops system that turns traffic → leads → booked calls → paid clients → retention with clean data + reliable follow-up.",
        expertise: [
            "Revenue Operations automation (n8n + Airtable + Slack + Gmail)",
            "Lead intake systems with deduplication and routing",
            "Client onboarding and retention automation",
            "AI-powered voice agents for inbound call handling",
            "Deterministic scaling architecture for agencies",
            "Clean data governance and source-of-truth architecture"
        ],
        methodology: "We build industrial-grade automation systems using client-owned infrastructure (automation@clientdomain.com sovereignty model). Every system includes dedupe logic, routing by intent, SLA escalation, and fail-safe error handling. We deploy in staging first, validate with the client, then cutover to production only after final payment.",
        successStories: [
            "Implemented BookedOS for a high-ticket agency, reducing lead response time from 4 hours to 2 minutes with automated Slack routing",
            "Built ClientFlow automation that cut onboarding time by 60% and improved retention by 35%",
            "Deployed AI CSR Voice Agent that captured $40K in previously missed after-hours calls in the first 90 days",
            "Created deterministic follow-up sequences that recovered 25% of no-show leads automatically"
        ],
        technicalStack: [
            "n8n Cloud (automation orchestration)",
            "Airtable (source of truth database)",
            "Slack (team notifications and escalations)",
            "Gmail (automated follow-up sequences)",
            "Retell/Vapi (AI voice agents when applicable)"
        ]
    },
    products: {
        "FlowStackOS Full": {
            description: "Complete Revenue Ops system with BookedOS (lead capture), ClientFlow (onboarding/retention), and Core (source of truth + reporting)",
            modules: [
                "BookedOS: Lead Capture → Qualification → Booking",
                "ClientFlow: Onboarding → Delivery → Retention",
                "FlowStackOS Core: Source of Truth + Automations + Reporting"
            ],
            outcomes: [
                "Unified data schema (source of truth) across all tools",
                "Automated booking + reminders + no-show recovery",
                "Smoother onboarding with fewer dropped balls",
                "Higher retention through automated check-ins and renewal nudges",
                "Dashboard for pipeline + follow-up health"
            ],
            timeline: "3 weeks standard implementation: Week 1 (Foundation + BookedOS), Week 2 (Automation + QA), Week 3 (ClientFlow + Launch)",
            pricing: {
                tiers: [
                    {
                        name: "Tier 1 — Landing Page Only",
                        includes: "1 conversion page + form + basic tracking",
                        investment: "₱25,000 ($429 USD)"
                    },
                    {
                        name: "Tier 2 — BookedOS Build",
                        includes: "Landing page + routing + booking + follow-up automations",
                        investment: "₱85,000 ($1,499 USD)"
                    },
                    {
                        name: "Tier 3 — Full FlowStackOS",
                        includes: "BookedOS + ClientFlow + Core (source of truth + reporting)",
                        investment: "₱450,000 ($7,699 USD)"
                    }
                ],
                ongoing: "₱15,000/month ($259 USD) - Monitoring, fixes, iterations, optimization"
            }
        },
        "BookedOS": {
            description: "Lead Capture → Qualification → Booking system with intelligent routing and automated follow-up",
            modules: [
                "Landing page + form built to convert",
                "Lead routing by intent (VIP / Standard / Inquiry)",
                "Automated booking + reminders + no-show recovery",
                "Structured intake (messy messages → clean fields)"
            ],
            outcomes: [
                "More qualified calls booked with less back-and-forth",
                "2-minute response time via Slack notifications",
                "Zero duplicate leads with dedupe_key logic",
                "Automated nurture sequences with kill switch control"
            ],
            timeline: "2 weeks: Week 1 (Intake + Router + Database), Week 2 (Nurture + Safety + Production cutover)",
            pricing: {
                tiers: [
                    {
                        name: "BookedOS Standard",
                        includes: "Full lead intake, routing, booking, and follow-up automation",
                        investment: "₱85,000 ($1,499 USD)"
                    }
                ],
                ongoing: "₱15,000/month ($259 USD) - Ongoing support and optimization"
            }
        },
        "AI CSR Voice Agent": {
            description: "24/7 inbound call handling with automatic qualification, booking, and logging to your system",
            modules: [
                "Inbound call answering (24/7 or after-hours)",
                "Qualification questions (your script + rules)",
                "Escalation to human (transfer or notify)",
                "Airtable logging (call record + summary)",
                "Slack alerts (new call, urgent escalation)",
                "Email follow-up (optional) from your company sender"
            ],
            outcomes: [
                "Zero missed calls turning into missed revenue",
                "Higher capture rate on after-hours leads",
                "Faster qualification and booking",
                "Complete call logs, summaries, and transcripts in Airtable",
                "Escalation paths for urgent or complex requests"
            ],
            timeline: "3-7 days from access granted, depending on call flow complexity",
            pricing: {
                tiers: [
                    {
                        name: "Tier 1 — Intake Only",
                        includes: "Answer, qualify, log to Airtable, Slack notify. No booking.",
                        investment: "Custom quote based on scope"
                    },
                    {
                        name: "Tier 2 — Intake + Booking",
                        includes: "Adds calendar booking/reschedule, plus confirmation email",
                        investment: "Custom quote based on scope"
                    },
                    {
                        name: "Tier 3 — Full CSR",
                        includes: "Adds knowledge base/Q&A, multi-intent routing, advanced analytics",
                        investment: "Custom quote based on scope"
                    }
                ],
                ongoing: "Setup fee + Monthly management + Usage (per-minute call costs)"
            }
        }
    },
    proposalTemplates: {
        executiveSummary: `Based on our analysis of your current operations, we've identified critical revenue leakage points in your lead-to-client pipeline. Our FlowStackOS implementation will plug these leaks through automated intake, intelligent routing, deterministic follow-up, and clean data architecture—delivering measurable revenue recovery within 90 days.`,
        solutionFramework: `Our proven 3-module architecture:

**BookedOS** — Captures and routes every lead with zero data loss
- Webhook intake with deduplication logic (no more duplicate records)
- Intent-based routing (VIP/Standard/Inquiry) with instant Slack alerts
- Automated booking sequences with no-show recovery
- Structured data normalization (messy → clean)

**ClientFlow** — Automates onboarding and retention
- Welcome sequences + automated kickoff scheduling
- Status tracking with handoff prompts (delivery never slips)
- Renewal reminders and retention check-ins
- Client update notifications

**FlowStackOS Core** — Your source of truth + orchestration layer
- Unified Airtable schema across all tools
- Automation orchestration (n8n workflows)
- Pipeline hygiene + next-follow-up logic
- Health dashboard (pipeline visibility + SLA tracking)`,
        implementationApproach: `**Week 1 — Foundation:**
- Define pipeline stages and lead lifecycle logic
- Stand up BookedOS intake + routing workflows
- Configure source-of-truth schema in Airtable

**Week 2 — Automation:**
- Build follow-up sequences and booking flows
- Configure Slack notifications and escalations
- Set up reporting dashboard and QA testing

**Week 3 — ClientFlow + Launch:**
- Deploy onboarding and retention automation
- Final staging validation and client sign-off
- Production cutover (after final payment)
- Handoff documentation and training

All builds follow our sovereignty model: automation@yourdomain.com owns the infrastructure, ensuring you maintain full control even if we part ways.`,
        valueProposition: `**Why FlowStackOS vs. doing this yourself or using off-the-shelf tools:**

**Sovereignty:** You own the system through automation@yourdomain.com—no vendor lock-in
**Clean Data:** Dedupe logic and source-of-truth architecture prevent messy CRM chaos
**Fail-Safe Design:** Kill switches, error logging, and SLA escalations built-in
**Proven Stack:** n8n + Airtable + Slack + Gmail = industrial-grade reliability
**ROI Timeline:** Measurable improvements within 30 days, full ROI within 90 days

Unlike DIY Zapier builds that break under load or expensive enterprise platforms that lock you in, FlowStackOS gives you production-grade automation that you truly own.`
    },
    industryInsights: {
        "High-Ticket Agency": {
            commonBottlenecks: [
                "Lead response time > 1 hour (prospects go cold)",
                "No clear owner assignment (leads fall through cracks)",
                "Manual follow-up (inconsistent, forgotten)",
                "Messy CRM data (duplicates, incomplete records)",
                "No-show rate > 30% (no automated reminders)",
                "No visibility into pipeline health"
            ],
            bestPractices: [
                "Implement instant Slack routing by lead intent (VIP gets 2-min response)",
                "Automate booking with calendar integration and reminder sequences",
                "Use dedupe_key logic to maintain single source of truth",
                "Deploy SLA escalation (uncontacted leads get flagged at 15 minutes)",
                "Build no-show recovery sequences (reschedule automation)",
                "Create daily pipeline digest for leadership visibility"
            ],
            successMetrics: [
                "Lead response time: < 5 minutes average",
                "Show rate improvement: 30% → 85%",
                "Lead-to-booked conversion: +40%",
                "Data quality: 0 duplicates, 100% complete records",
                "Revenue recovery: 15-25% from previously lost leads"
            ]
        },
        "SaaS": {
            commonBottlenecks: [
                "Trial signups don't convert (no automated nurture)",
                "Onboarding drop-off (manual, slow, inconsistent)",
                "Churn signals missed (no proactive outreach)",
                "Support tickets lost in email (no centralized tracking)",
                "Expansion opportunities invisible (no usage monitoring)"
            ],
            bestPractices: [
                "Automate trial nurture with usage-based triggers",
                "Build self-serve onboarding flows with progress tracking",
                "Implement churn risk alerts (activity drop-offs → Slack)",
                "Centralize support in Airtable with SLA tracking",
                "Create expansion playbooks (usage thresholds → upsell sequences)"
            ],
            successMetrics: [
                "Trial-to-paid conversion: +35%",
                "Onboarding completion: +50%",
                "Churn reduction: 15-20%",
                "Support response time: < 2 hours",
                "Expansion revenue: +25% from existing customers"
            ]
        },
        "E-commerce": {
            commonBottlenecks: [
                "Cart abandonment (no recovery sequence)",
                "Low repeat purchase rate (no retention automation)",
                "Customer service bottleneck (manual responses)",
                "Inventory issues (no proactive alerts)",
                "Post-purchase silence (no engagement)"
            ],
            bestPractices: [
                "Deploy cart abandonment recovery (3-email sequence)",
                "Build post-purchase nurture (reviews, upsells, loyalty)",
                "Automate customer service routing with AI triage",
                "Create inventory alerts with restock notifications",
                "Implement VIP customer identification and special treatment"
            ],
            successMetrics: [
                "Cart recovery rate: 15-20%",
                "Repeat purchase rate: +30%",
                "Customer service response: < 1 hour",
                "Average order value: +25% (upsell automation)",
                "Customer lifetime value: +40%"
            ]
        },
        "Professional Services": {
            commonBottlenecks: [
                "Proposal process too slow (manual, inconsistent)",
                "Client communication gaps (emails lost, delays)",
                "Project scope creep (no approval workflows)",
                "Billing delays (manual invoicing)",
                "Client retention (reactive, not proactive)"
            ],
            bestPractices: [
                "Automate proposal generation with templating",
                "Centralize client communication in Slack + Airtable",
                "Build change request workflows with approval gates",
                "Implement automated invoicing and payment reminders",
                "Create proactive check-in sequences for retention"
            ],
            successMetrics: [
                "Proposal turnaround: 2 days → 4 hours",
                "Project margin protection: +20% (scope control)",
                "Payment collection time: -50%",
                "Client retention rate: +35%",
                "Team efficiency: 30% more projects with same headcount"
            ]
        }
    },
    implementationStandards: {
        sovereignty: "All systems are built using automation@clientdomain.com as the owner identity. This ensures the client owns all integrations, credentials, and workflows—not the implementation partner. We build inside client-owned n8n Cloud, Airtable, and Slack workspaces. After handoff, our access is reduced or removed unless retained for ongoing support.",
        paymentStructure: "50% deposit required to start implementation in staging environment. 50% final payment required before production credential cutover and go-live. For larger scopes: 40% deposit / 40% after staging sign-off / 20% before go-live. Production credentials are NEVER connected until final payment clears.",
        qualityGates: [
            "Staging Sign-off Call: Client validates all routing rules, email sequences, and automation logic",
            "QA Testing: Minimum 10 test cases covering all lead types and failure scenarios",
            "Fail-Safe Verification: Kill switch and error logging tested and confirmed operational",
            "Documentation: Complete SOP, credential map, and troubleshooting guide delivered",
            "Handoff Training: Client team trained on daily operations and safe change procedures"
        ],
        deliveryApproach: "We deploy in three phases: (1) Staging build with fake data, (2) Staging validation with client approval, (3) Production cutover with live credentials. Every workflow includes observability (activity logs + error logs with correlation IDs), idempotency (dedupe logic prevents duplicates), and fail-safes (kill switches + human review queues)."
    }
};

// Function to get relevant knowledge for a specific niche
export const getRelevantKnowledge = (niche: string): string => {
    // Normalize niche for matching
    const nicheKey = Object.keys(defaultKnowledgeBase.industryInsights).find(
        key => niche.toLowerCase().includes(key.toLowerCase()) || key.toLowerCase().includes(niche.toLowerCase())
    );

    const insights = nicheKey ? defaultKnowledgeBase.industryInsights[nicheKey] : null;

    if (!insights) {
        return `**Industry Context for ${niche}:**

While we don't have pre-built playbooks for ${niche} specifically, our FlowStackOS architecture is industry-agnostic. The core challenges—lead leakage, slow response times, manual follow-up, messy data—are universal. We'll apply our proven methodology (dedupe logic, intent routing, SLA escalation, automated nurture) to your specific workflow.`;
    }

    return `**Industry-Specific Insights for ${nicheKey}:**

**Common Bottlenecks We See:**
${insights.commonBottlenecks.map((b, i) => `${i + 1}. ${b}`).join('\n')}

**Best Practices We'll Implement:**
${insights.bestPractices.map((p, i) => `${i + 1}. ${p}`).join('\n')}

**Expected Success Metrics:**
${insights.successMetrics.map((m, i) => `${i + 1}. ${m}`).join('\n')}`;
};

// Function to get product details
export const getProductDetails = (productName: string): string => {
    const product = defaultKnowledgeBase.products[productName];

    if (!product) {
        return "Product not found. Available products: FlowStackOS Full, BookedOS, AI CSR Voice Agent";
    }

    let details = `**${productName}**\n\n${product.description}\n\n`;

    details += `**Key Modules:**\n${product.modules.map((m, i) => `${i + 1}. ${m}`).join('\n')}\n\n`;

    details += `**Outcomes:**\n${product.outcomes.map((o, i) => `${i + 1}. ${o}`).join('\n')}\n\n`;

    details += `**Timeline:** ${product.timeline}\n\n`;

    details += `**Pricing:**\n`;
    product.pricing.tiers.forEach(tier => {
        details += `• ${tier.name}: ${tier.includes} — ${tier.investment}\n`;
    });
    details += `• Ongoing Support: ${product.pricing.ongoing}\n`;

    return details;
};
