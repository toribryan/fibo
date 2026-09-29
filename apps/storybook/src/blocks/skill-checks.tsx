import { useEffect, useMemo, useState } from "react"

import { Badge } from "@workspace/ui/components/badge"
import { Button } from "@workspace/ui/components/button"
import { Skeleton } from "@workspace/ui/components/skeleton"
import { cn } from "@workspace/ui/lib/utils"

import { LINKS } from "./links.js"
import {
  RULES,
  RULE_BY_ID,
  checkCollection,
  type FileReport,
  type Kind,
  type Level,
} from "./skill-rules.js"
import { githubUrl, loadFile, loadPaths } from "./skills-source.js"
import { stackedTable } from "./stacked-table.js"
import { mdxComponents } from "./typography.js"

const KIND_LABEL: Record<Kind, string> = {
  skill: "Skills",
  agent: "Reviewers",
  file: "Every Markdown file",
}

// A warning is a status of its own, so it takes the warning roles rather
// than a variant the Badge part does not have.
function LevelBadge({ level }: { level: Level | "pass" }) {
  if (level === "fail") return <Badge variant="destructive">Fails</Badge>
  if (level === "warn")
    return (
      <Badge
        variant="outline"
        className="border-transparent bg-warning-subtle text-warning"
      >
        Warning
      </Badge>
    )
  return (
    <Badge
      variant="outline"
      className="border-transparent bg-success-subtle text-success"
    >
      Passes
    </Badge>
  )
}

const COLUMNS = ["Rule", "Checks", "Source", "Result"]

function RulesTable({ reports }: { reports: FileReport[] }) {
  return (
    <div className={stackedTable.container}>
      <div className={stackedTable.frame}>
        <table className={stackedTable.table}>
          <thead className={stackedTable.thead}>
            <tr>
              {COLUMNS.map((column) => (
                <th key={column} className={stackedTable.th}>
                  {column}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className={stackedTable.tbody}>
            {RULES.map((rule) => {
              const checked = reports.filter(
                (report) => rule.kind === "file" || report.kind === rule.kind
              )
              const failing = checked.filter((report) =>
                report.findings.some((finding) => finding.rule === rule.id)
              ).length
              return (
                <tr
                  key={rule.id}
                  className={cn(
                    stackedTable.tr,
                    "@max-xl:grid @max-xl:grid-cols-[minmax(0,1fr)_auto] @max-xl:gap-x-3 @max-xl:gap-y-1"
                  )}
                >
                  <td className={cn(stackedTable.cell, "text-foreground")}>
                    {rule.label}
                    {rule.level === "warn" ? (
                      <span className="text-muted-foreground"> (default)</span>
                    ) : null}
                  </td>
                  <td
                    className={cn(
                      stackedTable.cell,
                      "@max-xl:row-start-2 @max-xl:text-xs"
                    )}
                  >
                    {KIND_LABEL[rule.kind]}
                  </td>
                  <td
                    className={cn(
                      stackedTable.cell,
                      "@max-xl:row-start-2 @max-xl:text-right @max-xl:text-xs"
                    )}
                  >
                    <code className="font-mono text-[0.8125rem] @max-xl:text-xs">
                      {rule.source}
                    </code>
                  </td>
                  <td
                    className={cn(
                      stackedTable.cell,
                      "@max-xl:col-start-2 @max-xl:row-start-1"
                    )}
                  >
                    {failing ? (
                      <span className="flex items-center gap-2 whitespace-nowrap">
                        <LevelBadge level={rule.level} />
                        {failing} of {checked.length}
                      </span>
                    ) : (
                      <LevelBadge level="pass" />
                    )}
                  </td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>
    </div>
  )
}

function FileFindings({ report }: { report: FileReport }) {
  return (
    <li className="flex flex-col gap-2 border-b border-border py-4 last:border-b-0">
      <mdxComponents.a
        href={githubUrl(report.path)}
        target="_blank"
        rel="noreferrer"
        className="self-start font-mono text-[0.8125rem]"
      >
        {report.path}
      </mdxComponents.a>
      {report.findings.length ? (
        <ul className="flex flex-col gap-2">
          {report.findings.map((finding, index) => {
            const rule = RULE_BY_ID.get(finding.rule)!
            return (
              <li
                key={`${finding.rule}-${index}`}
                className="flex flex-wrap items-baseline gap-x-2 gap-y-1 text-sm leading-6"
              >
                <LevelBadge level={rule.level} />
                <span className="text-foreground">{rule.label}.</span>
                <span className="text-muted-foreground">{finding.message}</span>
              </li>
            )
          })}
        </ul>
      ) : (
        <p className="text-sm text-muted-foreground">Passes every check.</p>
      )}
    </li>
  )
}

function SkillChecks() {
  const [reports, setReports] = useState<FileReport[]>()
  const [error, setError] = useState<string>()
  const [scope, setScope] = useState<"problems" | "all">("problems")

  useEffect(() => {
    let live = true
    loadPaths()
      .then(async (paths) => {
        const markdown = paths.filter((path) => path.endsWith(".md"))
        const sources = await Promise.all(markdown.map(loadFile))
        return checkCollection({
          paths,
          files: new Map(
            markdown.map((path, index) => [path, sources[index]!])
          ),
        })
      })
      .then(
        (next) => live && setReports(next),
        (reason: Error) => live && setError(reason.message)
      )
    return () => {
      live = false
    }
  }, [])

  const totals = useMemo(() => {
    const findings = reports?.flatMap((report) => report.findings) ?? []
    const level = (id: string) => RULE_BY_ID.get(id)!.level
    return {
      skills: reports?.filter((report) => report.kind === "skill").length ?? 0,
      agents: reports?.filter((report) => report.kind === "agent").length ?? 0,
      failures: findings.filter((finding) => level(finding.rule) === "fail")
        .length,
      warnings: findings.filter((finding) => level(finding.rule) === "warn")
        .length,
    }
  }, [reports])

  if (error) {
    return (
      <p className="my-6 rounded-xl border border-border p-6 text-sm text-muted-foreground">
        The skills did not load from GitHub ({error}), so nothing was checked.
        Try again later, or browse the{" "}
        <mdxComponents.a
          href={LINKS.designSkills}
          target="_blank"
          rel="noreferrer"
        >
          design-skills repo
        </mdxComponents.a>
        .
      </p>
    )
  }

  if (!reports) {
    return (
      <div aria-busy className="my-8 flex flex-col gap-3">
        <p className="text-sm text-muted-foreground">
          Loading the skills from GitHub
        </p>
        {Array.from({ length: 6 }, (_, index) => (
          <Skeleton key={index} className="h-9 w-full" />
        ))}
      </div>
    )
  }

  const shown =
    scope === "all"
      ? reports.filter((report) => report.kind !== "file")
      : reports.filter((report) => report.findings.length)

  return (
    <div className="my-8 flex flex-col gap-10">
      <div className="flex flex-col gap-3">
        <p aria-live="polite" className="text-sm text-muted-foreground">
          {totals.skills} skills, {totals.agents} reviewers and {reports.length}{" "}
          Markdown files checked:{" "}
          <span className="text-foreground">
            {totals.failures} {totals.failures === 1 ? "failure" : "failures"},{" "}
            {totals.warnings} {totals.warnings === 1 ? "warning" : "warnings"}
          </span>
          .
        </p>
        <RulesTable reports={reports} />
      </div>

      <section
        aria-labelledby="skill-checks-findings"
        className="flex flex-col gap-3"
      >
        <div className="flex flex-wrap items-center justify-between gap-3">
          <h3
            id="skill-checks-findings"
            className="skip-toc text-base font-semibold text-foreground"
          >
            By file
          </h3>
          <div role="group" aria-label="Show" className="flex gap-1">
            {(["problems", "all"] as const).map((option) => (
              <Button
                key={option}
                variant={scope === option ? "secondary" : "ghost"}
                size="xs"
                aria-pressed={scope === option}
                onClick={() => setScope(option)}
              >
                {option === "problems"
                  ? "Problems"
                  : "Every skill and reviewer"}
              </Button>
            ))}
          </div>
        </div>
        {shown.length ? (
          <ul className="flex flex-col rounded-xl border border-border px-4">
            {shown.map((report) => (
              <FileFindings key={report.path} report={report} />
            ))}
          </ul>
        ) : (
          <p className="rounded-xl border border-border p-6 text-sm text-muted-foreground">
            Every file passes every check.
          </p>
        )}
      </section>
    </div>
  )
}

export { SkillChecks }
