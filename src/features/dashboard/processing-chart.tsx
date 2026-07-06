import {
  Area,
  AreaChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts"

const activity = [
  { day: "09 Jun", processed: 8 },
  { day: "13 Jun", processed: 14 },
  { day: "17 Jun", processed: 11 },
  { day: "21 Jun", processed: 20 },
  { day: "25 Jun", processed: 16 },
  { day: "29 Jun", processed: 24 },
  { day: "03 Jul", processed: 19 },
  { day: "06 Jul", processed: 28 },
]

export default function ProcessingChart() {
  return (
    <ResponsiveContainer width="100%" height="100%">
      <AreaChart data={activity} margin={{ top: 8, right: 8, bottom: 0, left: -24 }}>
        <defs>
          <linearGradient id="activityFill" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="var(--color-primary)" stopOpacity={0.2} />
            <stop offset="100%" stopColor="var(--color-primary)" stopOpacity={0} />
          </linearGradient>
        </defs>
        <CartesianGrid stroke="var(--color-border)" vertical={false} />
        <XAxis dataKey="day" axisLine={false} tickLine={false} tick={{ fontSize: 11, fill: "var(--color-muted-foreground)" }} />
        <YAxis axisLine={false} tickLine={false} allowDecimals={false} tick={{ fontSize: 11, fill: "var(--color-muted-foreground)" }} />
        <Tooltip contentStyle={{ border: "1px solid var(--color-border)", borderRadius: 8, fontSize: 12 }} />
        <Area type="monotone" dataKey="processed" stroke="var(--color-primary)" strokeWidth={2} fill="url(#activityFill)" />
      </AreaChart>
    </ResponsiveContainer>
  )
}
