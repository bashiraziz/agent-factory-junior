import { Html, Head, Body, Container, Section, Text, Heading, Hr, Button } from "@react-email/components";
import { render } from "@react-email/render";

export interface ChildSummary {
  name: string;
  runsThisWeek: number;
  safeRuns: number;
  flaggedRuns: number;
  workersBuilt: number;
  badgesEarned: string[];
  lessonLevel: number | null;
}

interface Props {
  parentName: string;
  children: ChildSummary[];
  weekOf: string;
  dashboardUrl: string;
}

export function WeeklyReportEmail({ parentName, children, weekOf, dashboardUrl }: Props) {
  return (
    <Html>
      <Head />
      <Body style={{ background: "#FFFDF7", fontFamily: "Nunito, Arial, sans-serif" }}>
        <Container style={{ maxWidth: 560, margin: "32px auto", padding: "0 16px" }}>

          <Section style={{ background: "#7C5CFF", borderRadius: 16, padding: "28px 32px", marginBottom: 24 }}>
            <Text style={{ color: "#FFC53D", fontWeight: 700, fontSize: 12, letterSpacing: 2, margin: 0 }}>
              AGENT FACTORY JUNIOR
            </Text>
            <Heading style={{ color: "#fff", fontSize: 26, margin: "8px 0 4px" }}>
              Weekly learning report
            </Heading>
            <Text style={{ color: "#C4B5FD", fontSize: 14, margin: 0 }}>{weekOf}</Text>
          </Section>

          <Text style={{ color: "#5C5747", fontSize: 16, marginBottom: 24 }}>
            Hi {parentName}, here&apos;s what happened in your family&apos;s learning this week.
          </Text>

          {children.map((child) => (
            <Section key={child.name} style={{ background: "#fff", border: "2px solid #F0E7D6", borderRadius: 14, padding: "22px 26px", marginBottom: 16 }}>
              <Heading as="h2" style={{ fontSize: 20, color: "#2A2A3C", margin: "0 0 12px" }}>
                {child.name}
              </Heading>

              <Section style={{ display: "flex", gap: 12, marginBottom: 14 }}>
                {[
                  { label: "Runs", value: child.runsThisWeek, color: "#7C5CFF" },
                  { label: "Safe", value: child.safeRuns, color: "#46C46A" },
                  { label: "Flags", value: child.flaggedRuns, color: child.flaggedRuns > 0 ? "#E0792B" : "#8A8071" },
                  { label: "Workers", value: child.workersBuilt, color: "#3DA5F4" },
                ].map((s) => (
                  <div key={s.label} style={{ flex: 1, textAlign: "center", background: "#FBF6EC", borderRadius: 10, padding: "10px 4px" }}>
                    <div style={{ fontSize: 22, fontWeight: 700, color: s.color }}>{s.value}</div>
                    <div style={{ fontSize: 10, color: "#8A8071", letterSpacing: 1 }}>{s.label.toUpperCase()}</div>
                  </div>
                ))}
              </Section>

              {child.lessonLevel !== null && (
                <Text style={{ fontSize: 14, color: "#5C5747", margin: "0 0 8px" }}>
                  📖 Currently on <strong>Level {child.lessonLevel} of 8</strong> in the &quot;Meet the AI&quot; book.
                </Text>
              )}

              {child.badgesEarned.length > 0 && (
                <Text style={{ fontSize: 14, color: "#5C5747", margin: "0 0 0" }}>
                  🏅 Badges earned this week: <strong>{child.badgesEarned.join(", ")}</strong>
                </Text>
              )}

              {child.runsThisWeek === 0 && (
                <Text style={{ fontSize: 14, color: "#8A8071", margin: 0 }}>
                  No runs this week — remind {child.name} to log in and keep building!
                </Text>
              )}
            </Section>
          ))}

          <Hr style={{ borderColor: "#F0E7D6", margin: "24px 0" }} />

          <Button href={dashboardUrl} style={{ background: "#18B5A0", color: "#fff", padding: "13px 28px", borderRadius: 999, fontWeight: 700, fontSize: 15 }}>
            Open family dashboard →
          </Button>

          <Text style={{ fontSize: 12, color: "#8A8071", marginTop: 24 }}>
            You&apos;re getting this because you opted in to weekly reports.
            You can turn it off any time in your family dashboard under each child&apos;s settings.
          </Text>
        </Container>
      </Body>
    </Html>
  );
}

export async function renderWeeklyReport(props: Props): Promise<string> {
  return render(<WeeklyReportEmail {...props} />);
}
