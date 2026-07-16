import * as React from "react"
import {
  Alert,
  AnimatedAlert,
  AnnouncementBar,
  Badge,
  NumberBadge,
  StatusBadge,
  Banner,
  BrandLogo,
  BrandMark,
  Breadcrumb,
  BreadcrumbList,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbPage,
  BreadcrumbSeparator,
  Button,
  ButtonGroup,
  ButtonGroupItem,
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
  CardFooter,
  CompactButton,
  DashLogo,
  DiscountLineItem,
  DotStepper,
  EmptyState,
  EmptyStateTitle,
  EmptyStateDescription,
  EmptyStateActions,
  EmptyStateIllustration,
  FancyButton,
  FancyLoader,
  Field,
  FileUploadDropzone,
  Flag,
  Hint,
  IconButton,
  InformationBanner,
  InputRoot,
  SearchField,
  TableData,
  Input,
  InputIcon,
  Kbd,
  Label,
  LinkButton,
  NotificationOnboarding,
  Pagination,
  PaginationList,
  PaginationItem,
  PaginationButton,
  PaginationPrevious,
  PaginationNext,
  Paginator,
  SearchSelect,
  PasswordInput,
  PriceWithDiscount,
  ProgressCircle,
  Rating,
  RichEditor,
  ShieldCrown,
  Shimmer,
  SidebarProvider,
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupLabel,
  SidebarItem,
  Skeleton,
  SocialButton,
  Spinner,
  SpinnerLoader,
  Stat,
  StatLabel,
  StatValue,
  StatTrend,
  StepIndicator,
  Step,
  Table,
  TableHeader,
  TableBody,
  TableRow,
  TableHead,
  TableCell,
  Tag,
  Textarea,
  TimePicker,
  WidgetShell,
} from "@dash-electric/logistic-kit"
import {
  RiTruckLine,
  RiSearchLine,
  RiMapPin2Line,
  RiAddLine,
  RiMore2Fill,
  RiNotification3Line,
  RiInboxLine,
  RiDownloadLine,
  RiHome5Line,
  RiBox3Line,
  RiRouteLine,
} from "@remixicon/react"

export type Demo = {
  /** Exported component name(s). */
  name: string
  /** One-line description in operator voice. */
  description: string
  render: () => React.ReactNode
}

export type Category = {
  id: string
  title: string
  blurb: string
  demos: Demo[]
}

/* A small helper so demo rows lay out consistently. */
const Row = ({ children }: { children: React.ReactNode }) => (
  <div className="flex flex-wrap items-center gap-3">{children}</div>
)

const Swatch = ({ color, name, hex, ring }: { color: string; name: string; hex: string; ring?: boolean }) => (
  <div className="flex items-center gap-3">
    <span
      className={`size-9 shrink-0 rounded-lg ${ring ? "border border-stroke-sub-300" : ""}`}
      style={{ background: color }}
    />
    <div className="leading-tight">
      <div className="text-sm font-medium text-text-strong-950">{name}</div>
      <div className="gsm-mono text-xs text-text-sub-600">{hex}</div>
    </div>
  </div>
)

const BASE_CATEGORIES: Category[] = [
  {
    id: "foundation",
    title: "Brand foundation",
    blurb: "The Logistic Graphic Standard Manual, encoded as tokens. One accent, ink + white + greys, hairline rules, Plus Jakarta + JetBrains Mono.",
    demos: [
      {
        name: "Color system",
        description: "One brand color, two anchors, greys. Color is information, not decoration.",
        render: () => (
          <div className="grid grid-cols-2 gap-4">
            <Swatch color="var(--dash-purple-500)" name="Primary · Dash Purple" hex="#5E2AAC" />
            <Swatch color="var(--dash-gray-950)" name="Ink" hex="#171717" />
            <Swatch color="var(--dash-gray-0)" name="White" hex="#FFFFFF" ring />
            <Swatch color="var(--dash-gray-600)" name="Neutral" hex="#5C5C5C" />
            <Swatch color="var(--dash-black-alpha-10)" name="Rule" hex="10% black" ring />
            <Swatch color="var(--dash-black-alpha-22)" name="Rule strong" hex="22% black" ring />
          </div>
        ),
      },
      {
        name: "Type scale",
        description: "Plus Jakarta Sans (200–800). Tighter tracking as type grows; tabular numerals on figures.",
        render: () => (
          <div className="space-y-2 text-text-strong-950">
            <p className="gsm-huge text-4xl">Scan, sort, batch</p>
            <p className="gsm-large text-2xl">Section head</p>
            <p className="gsm-medium text-lg">Subhead</p>
            <p className="gsm-lede text-base text-text-sub-600">Lede — the intro paragraph sets context in one calm line.</p>
            <p className="gsm-body text-sm text-text-sub-600">Body copy carries the detail at a steady 400 weight.</p>
            <p className="gsm-label text-xs text-text-sub-600">Label · UI chrome</p>
            <p className="gsm-mono text-sm text-text-strong-950">Job.destination_type · BAG-90213</p>
          </div>
        ),
      },
      {
        name: "Rules & tints",
        description: "Hairlines separate ideas; whitespace carries weight. No glow, no gradients, no shadows.",
        render: () => (
          <div className="space-y-0">
            <div className="flex items-center justify-between py-2 text-sm">
              <span className="text-text-strong-950">First-mile pickup</span>
              <span className="gsm-mono tabular text-text-sub-600">08:00</span>
            </div>
            <div className="h-px w-full bg-stroke-soft-200" />
            <div className="flex items-center justify-between py-2 text-sm">
              <span className="text-text-strong-950">Hub intake</span>
              <span className="gsm-mono tabular text-text-sub-600">12:30</span>
            </div>
            <div className="h-px w-full bg-stroke-sub-300" />
            <div className="mt-2 inline-block rounded bg-[color:var(--dash-black-alpha-4)] px-2 py-1">
              <code className="gsm-mono text-xs text-text-strong-950">items.create</code>
            </div>
          </div>
        ),
      },
    ],
  },
  {
    id: "brand",
    title: "Brand & identity",
    blurb: "Logo lockups and emblem marks. Dash Purple is the family identity; never redraw or recolor the logo.",
    demos: [
      {
        name: "DashLogo",
        description: "Inline SVG wordmark + mark. Scales crisply at any size.",
        render: () => (
          <Row>
            <DashLogo variant="wordmark" size="lg" />
            <DashLogo variant="mark" size="lg" />
          </Row>
        ),
      },
      {
        name: "BrandMark",
        description: "Square emblem tile for avatars, app icons, and dense rails.",
        render: () => (
          <Row>
            <BrandMark />
          </Row>
        ),
      },
      {
        name: "BrandLogo",
        description: "Third-party brand glyph by slug (host app serves /brand/*.svg).",
        render: () => (
          <Row>
            <BrandLogo name="dash" size={28} />
          </Row>
        ),
      },
      {
        name: "Flag",
        description: "Country flag by code (host app serves /flags/*.svg).",
        render: () => (
          <Row>
            <Flag code="indonesia" size={28} className="rounded-sm" />
            <Flag code="singapore" size={28} className="rounded-sm" />
          </Row>
        ),
      },
      {
        name: "ShieldCrown",
        description: "Trust / verified-partner emblem for KYC and tier badges.",
        render: () => (
          <Row>
            <ShieldCrown className="size-10 text-accent" />
          </Row>
        ),
      },
    ],
  },
  {
    id: "actions",
    title: "Actions",
    blurb: "One primary action per region. The primary CTA is ink — Dash Purple is reserved for punctuation (stroke, links, selection), never a button fill.",
    demos: [
      {
        name: "Button",
        description: "Primary control. Tone × style × size matrix, with loading + icon slots.",
        render: () => (
          <div className="space-y-3">
            <Row>
              <Button>Assign batch</Button>
              <Button tone="neutral" style="stroke">Reassign</Button>
              <Button tone="destructive" style="lighter">Cancel pickup</Button>
            </Row>
            <Row>
              <Button leftIcon={<RiTruckLine />}>Dispatch</Button>
              <Button loading>Saving</Button>
              <Button disabled>Disabled</Button>
              <Button size="xs">Extra small</Button>
            </Row>
          </div>
        ),
      },
      {
        name: "FancyButton",
        description: "Flat ink emphasis button (GSM-flattened — sheen + glow removed). Prefer Button for new work.",
        render: () => (
          <Row>
            <FancyButton>Confirm route</FancyButton>
            <FancyButton tone="neutral">Secondary</FancyButton>
            <FancyButton tone="destructive">Abort</FancyButton>
          </Row>
        ),
      },
      {
        name: "IconButton",
        description: "Icon-only trigger for toolbars and table-row actions.",
        render: () => (
          <Row>
            <IconButton aria-label="Search"><RiSearchLine /></IconButton>
            <IconButton aria-label="More" tone="neutral" style="stroke"><RiMore2Fill /></IconButton>
            <IconButton aria-label="Locate" tone="primary" style="lighter"><RiMapPin2Line /></IconButton>
          </Row>
        ),
      },
      {
        name: "CompactButton",
        description: "Tiny utility button (close, expand) — requires an aria-label.",
        render: () => (
          <Row>
            <CompactButton aria-label="Add"><RiAddLine /></CompactButton>
            <CompactButton aria-label="Add" variant="stroke"><RiAddLine /></CompactButton>
            <CompactButton aria-label="Add" variant="white" fullRadius><RiAddLine /></CompactButton>
          </Row>
        ),
      },
      {
        name: "LinkButton",
        description: "Text-link styled action for inline navigation.",
        render: () => (
          <Row>
            <LinkButton href="#actions">View manifest</LinkButton>
            <LinkButton href="#actions" tone="neutral" underline="always">Audit trail</LinkButton>
          </Row>
        ),
      },
      {
        name: "ButtonGroup",
        description: "Segmented set of related actions sharing one container.",
        render: () => (
          <Row>
            <ButtonGroup>
              <ButtonGroupItem>Day</ButtonGroupItem>
              <ButtonGroupItem>Week</ButtonGroupItem>
              <ButtonGroupItem>Month</ButtonGroupItem>
            </ButtonGroup>
          </Row>
        ),
      },
      {
        name: "SocialButton",
        description: "Branded auth button for login shells.",
        render: () => (
          <Row>
            <SocialButton brand="google" />
            <SocialButton brand="apple" />
            <SocialButton brand="github" />
          </Row>
        ),
      },
      {
        name: "Kbd",
        description: "Keyboard shortcut hint chip.",
        render: () => (
          <Row>
            <span className="text-sm text-text-sub-600">Scan</span>
            <Kbd>⌘</Kbd>
            <Kbd>K</Kbd>
          </Row>
        ),
      },
    ],
  },
  {
    id: "forms",
    title: "Forms & inputs",
    blurb: "Field-level validation, explicit state. Show errors near the field.",
    demos: [
      {
        name: "Input · InputRoot · InputIcon",
        description: "Composed text input with leading icon affix.",
        render: () => (
          <div className="max-w-sm space-y-3">
            <InputRoot>
              <InputIcon><RiSearchLine /></InputIcon>
              <Input placeholder="Search bag ID…" />
            </InputRoot>
          </div>
        ),
      },
      {
        name: "SearchField",
        description: "Debounced search input with clear button and optional suggestions. onChange fires per keystroke; onSearch fires debounced.",
        render: function SearchFieldDemo() {
          const [q, setQ] = React.useState("")
          return (
            <div className="max-w-sm">
              <SearchField
                value={q}
                onChange={setQ}
                placeholder="Search code, name, address\u2026"
                suggestions={["CGK-01 \u00b7 Kemang", "CGK-02 \u00b7 Cilandak", "BDG-01 \u00b7 Dago"]}
              />
            </div>
          )
        },
      },
      {
        name: "PasswordInput",
        description: "Input with show/hide toggle.",
        render: () => (
          <div className="max-w-sm">
            <PasswordInput placeholder="Driver PIN" />
          </div>
        ),
      },
      {
        name: "Textarea",
        description: "Multi-line input for notes and exceptions.",
        render: () => (
          <div className="max-w-sm">
            <Textarea placeholder="Exception note (e.g. recipient not home)…" rows={3} />
          </div>
        ),
      },
      {
        name: "Label · Field · Hint",
        description: "Labeled field stack with helper / error hint.",
        render: () => (
          <Field className="max-w-sm">
            <Label htmlFor="hub">Origin hub</Label>
            <InputRoot>
              <Input id="hub" placeholder="JKT-CGK-01" />
            </InputRoot>
            <Hint>Format: CITY-FACILITY-DOCK</Hint>
          </Field>
        ),
      },
      {
        name: "TimePicker",
        description: "HH:MM slot picker for pickup / cutoff windows.",
        render: () => <TimePicker defaultValue="09:30" />,
      },
      {
        name: "Rating",
        description: "Controlled star rating for driver / POD feedback.",
        render: function RatingDemo() {
          const [v, setV] = React.useState(4)
          return <Rating value={v} onValueChange={setV} />
        },
      },
      {
        name: "FileUploadDropzone",
        description: "Drag-and-drop zone for POD photos and manifests.",
        render: () => (
          <div className="max-w-md">
            <FileUploadDropzone>
              <div className="flex flex-col items-center gap-1 text-sm text-text-sub-600">
                <RiDownloadLine className="size-6" />
                <span>Drop POD photos or <span className="text-accent">browse</span></span>
              </div>
            </FileUploadDropzone>
          </div>
        ),
      },
      {
        name: "RichEditor",
        description: "Tiptap-backed rich text for SOPs and announcements.",
        render: () => (
          <div className="max-w-lg">
            <RichEditor />
          </div>
        ),
      },
    ],
  },
  {
    id: "feedback",
    title: "Feedback & status",
    blurb: "Domain state labels only. Status color is operational data — not brand. Dash Purple stays reserved for punctuation.",
    demos: [
      {
        name: "Badge",
        description: "Status pill. 11 semantic statuses × filled/lighter/stroke appearances.",
        render: () => (
          <div className="space-y-3">
            <Row>
              <Badge status="success">Delivered</Badge>
              <Badge status="warning">Delayed</Badge>
              <Badge status="information">In transit</Badge>
              <Badge status="error">Failed</Badge>
              <Badge status="feature">Priority</Badge>
            </Row>
            <Row>
              <Badge status="information" appearance="filled" type="dot">Picked up</Badge>
              <Badge status="success" appearance="stroke">At hub</Badge>
            </Row>
          </div>
        ),
      },
      {
        name: "StatusBadge",
        description: "Dotted status badge for live entity state.",
        render: () => (
          <Row>
            <StatusBadge status="success">Online</StatusBadge>
            <StatusBadge status="away">Idle</StatusBadge>
            <StatusBadge status="error">Offline</StatusBadge>
          </Row>
        ),
      },
      {
        name: "NumberBadge",
        description: "Count badge for queues and unread notifications.",
        render: () => (
          <Row>
            <NumberBadge status="error" value={8} />
            <NumberBadge status="information" value={24} />
            <NumberBadge status="feature" value={120} />
          </Row>
        ),
      },
      {
        name: "Tag",
        description: "Removable filter / attribute tag.",
        render: function TagDemo() {
          const [on, setOn] = React.useState(true)
          return (
            <Row>
              <Tag>Same-day</Tag>
              <Tag variant="gray">COD</Tag>
              {on && <Tag variant="primary" onRemove={() => setOn(false)}>Fragile</Tag>}
            </Row>
          )
        },
      },
      {
        name: "Alert",
        description: "In-context message. 5 statuses, dismissible, with action slot.",
        render: () => (
          <div className="max-w-xl space-y-2">
            <Alert status="warning" title="3 bags missed the cutoff" action={<a href="#feedback">Reassign</a>}>
              Move them to the next wave or escalate to the hub lead.
            </Alert>
            <Alert status="success" title="Wave dispatched" dismissible />
          </div>
        ),
      },
      {
        name: "AnimatedAlert",
        description: "Alert that animates in/out for transient feedback.",
        render: () => (
          <div className="max-w-xl">
            <AnimatedAlert
              error={{
                type: "information",
                title: "Sync complete",
                message: "Manifest updated from the WMS 2 minutes ago.",
              }}
            />
          </div>
        ),
      },
      {
        name: "Banner",
        description: "Full-width page-level message.",
        render: () => (
          <div className="max-w-2xl">
            <Banner status="feature" title="Peak season routing is live" action={<a href="#feedback">Learn more</a>} />
          </div>
        ),
      },
      {
        name: "InformationBanner",
        description: "Auto-rotating promo / info carousel (host serves slide images).",
        render: () => (
          <div className="max-w-md">
            <InformationBanner
              slides={[
                { id: "1", image: "/brand/empty-states/notes.svg", alt: "Tip 1" },
                { id: "2", image: "/brand/dash.svg", alt: "Tip 2" },
              ]}
            />
          </div>
        ),
      },
      {
        name: "AnnouncementBar",
        description: "Slim top-of-app announcement strip.",
        render: () => (
          <div className="max-w-2xl">
            <AnnouncementBar text="Hub JKT-CGK-01 closes intake at 21:00 tonight." />
          </div>
        ),
      },
    ],
  },
  {
    id: "data",
    title: "Data display",
    blurb: "Scan-friendly surfaces. Right-align numerics, tabular numerals on every figure.",
    demos: [
      {
        name: "Card",
        description: "Framed content block. Never nest cards inside cards.",
        render: () => (
          <Card className="max-w-sm">
            <CardHeader>
              <CardTitle>Wave 14 · CGK-01</CardTitle>
              <CardDescription>Cutoff 21:00 · 312 bags</CardDescription>
            </CardHeader>
            <CardContent className="text-sm text-text-sub-600">
              218 sorted · 94 pending · 0 exceptions.
            </CardContent>
            <CardFooter>
              <Button size="sm">Open wave</Button>
            </CardFooter>
          </Card>
        ),
      },
      {
        name: "TableData",
        description: "Config-driven data table: columns array, cycle sorting, checkbox selection, sticky action column, skeleton loading, search-aware empty state. Status columns auto-render as StatusBadge.",
        render: function TableDataDemo() {
          const [selected, setSelected] = React.useState<string[]>([])
          const rows = [
            { id: "1", code: "CGK-01", name: "Kemang", status: "Active", bags: 312 },
            { id: "2", code: "CGK-02", name: "Cilandak", status: "Processing", bags: 187 },
            { id: "3", code: "BDG-01", name: "Dago", status: "Inactive", bags: 0 },
          ]
          return (
            <TableData
              data={rows}
              size="sm"
              columns={[
                { key: "code", title: "Code", sortable: true },
                { key: "name", title: "Name" },
                { key: "status", title: "Status" },
                { key: "bags", title: "Bags", align: "right", sortable: true },
              ]}
              selection={{
                selectedKeys: selected,
                onSelectionChange: setSelected,
                getRowKey: (r) => r.id,
              }}
            />
          )
        },
      },
      {
        name: "Stat",
        description: "KPI tile with trend indicator.",
        render: () => (
          <div className="flex flex-wrap gap-4">
            <Stat className="min-w-40 rounded-2xl border border-stroke-soft-200 p-4">
              <StatLabel>On-time rate</StatLabel>
              <StatValue className="tabular">96.4%</StatValue>
              <StatTrend trend="up">+1.8 pts</StatTrend>
            </Stat>
            <Stat className="min-w-40 rounded-2xl border border-stroke-soft-200 p-4">
              <StatLabel>Avg dwell</StatLabel>
              <StatValue className="tabular">42s</StatValue>
              <StatTrend trend="down">-6s</StatTrend>
            </Stat>
          </div>
        ),
      },
      {
        name: "Table",
        description: "Scannable rows: stable columns, status chips, right-aligned numbers.",
        render: () => (
          <Table className="max-w-2xl">
            <TableHeader>
              <TableRow>
                <TableHead>Bag ID</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Stops</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              <TableRow>
                <TableCell className="font-mono">BAG-90213</TableCell>
                <TableCell><Badge status="information" type="dot">In transit</Badge></TableCell>
                <TableCell className="text-right tabular">12</TableCell>
              </TableRow>
              <TableRow>
                <TableCell className="font-mono">BAG-90214</TableCell>
                <TableCell><Badge status="success" type="dot">Delivered</Badge></TableCell>
                <TableCell className="text-right tabular">8</TableCell>
              </TableRow>
            </TableBody>
          </Table>
        ),
      },
      {
        name: "Pagination",
        description: "Page navigation for long manifests.",
        render: () => (
          <Pagination>
            <PaginationList>
              <PaginationItem><PaginationPrevious /></PaginationItem>
              <PaginationItem><PaginationButton isActive>1</PaginationButton></PaginationItem>
              <PaginationItem><PaginationButton>2</PaginationButton></PaginationItem>
              <PaginationItem><PaginationButton>3</PaginationButton></PaginationItem>
              <PaginationItem><PaginationNext /></PaginationItem>
            </PaginationList>
          </Pagination>
        ),
      },
      {
        name: "Paginator",
        description: "Complete table paginator: window + page-size select + callbacks.",
        render: () => {
          const [page, setPage] = React.useState(3)
          const [size, setSize] = React.useState(20)
          return (
            <Paginator
              currentPage={page}
              totalItems={248}
              itemsPerPage={size}
              onPageChange={setPage}
              onPageSizeChange={(s) => {
                setSize(s)
                setPage(1)
              }}
            />
          )
        },
      },
      {
        name: "SearchSelect",
        description: "Async searchable select — server search, load-more, clear, label fallback.",
        render: () => {
          const [value, setValue] = React.useState<string>("")
          return (
            <div className="w-72">
              <SearchSelect
                options={[
                  { value: "1", label: "DASH-JKT-UTARA" },
                  { value: "2", label: "DASH-JKT-SELATAN" },
                  { value: "3", label: "DASH-BANDUNG" },
                ]}
                value={value}
                onChange={setValue}
                placeholder="Search or pick a hub…"
                allowClear
              />
            </div>
          )
        },
      },
      {
        name: "Breadcrumb",
        description: "Hierarchy trail for nested hub / wave / bag views.",
        render: () => (
          <Breadcrumb>
            <BreadcrumbList>
              <BreadcrumbItem><BreadcrumbLink href="#data">Hubs</BreadcrumbLink></BreadcrumbItem>
              <BreadcrumbSeparator />
              <BreadcrumbItem><BreadcrumbLink href="#data">CGK-01</BreadcrumbLink></BreadcrumbItem>
              <BreadcrumbSeparator />
              <BreadcrumbItem><BreadcrumbPage>Wave 14</BreadcrumbPage></BreadcrumbItem>
            </BreadcrumbList>
          </Breadcrumb>
        ),
      },
      {
        name: "PriceWithDiscount",
        description: "Price pair (struck original + final). IDR formatting by default.",
        render: () => (
          <Row>
            <PriceWithDiscount amount={45000} discountAmount={9000} finalAmount={36000} size="lg" />
          </Row>
        ),
      },
      {
        name: "DiscountLineItem",
        description: "Itemized discount line for cost breakdowns.",
        render: () => (
          <div className="max-w-xs">
            <DiscountLineItem amount={45000} discountAmount={9000} label="Loyalty discount" />
          </div>
        ),
      },
    ],
  },
  {
    id: "navigation",
    title: "Navigation & layout",
    blurb: "Workspace chrome. Preserve the host app's navigation model.",
    demos: [
      {
        name: "Sidebar",
        description: "App rail with grouped, active-aware items.",
        render: () => (
          <SidebarProvider className="max-w-60 rounded-2xl border border-stroke-soft-200">
            <Sidebar>
              <SidebarContent>
                <SidebarGroup>
                  <SidebarGroupLabel>Operations</SidebarGroupLabel>
                  <SidebarItem active><RiHome5Line /> Dashboard</SidebarItem>
                  <SidebarItem><RiBox3Line /> Bags</SidebarItem>
                  <SidebarItem><RiRouteLine /> Routes</SidebarItem>
                </SidebarGroup>
              </SidebarContent>
            </Sidebar>
          </SidebarProvider>
        ),
      },
      {
        name: "WidgetShell",
        description: "Standard dashboard widget frame with title + footer link.",
        render: () => (
          <div className="max-w-sm">
            <WidgetShell title="Active waves" seeAll>
              <p className="text-sm text-text-sub-600">3 waves running across 2 hubs.</p>
            </WidgetShell>
          </div>
        ),
      },
      {
        name: "StepIndicator · Step",
        description: "Linear progress through a multi-stage flow.",
        render: () => (
          <StepIndicator>
            <Step index={1} status="completed" label="Picked up" />
            <Step index={2} status="current" label="In transit" />
            <Step index={3} status="upcoming" label="Delivered" withConnector={false} />
          </StepIndicator>
        ),
      },
      {
        name: "DotStepper",
        description: "Compact dot progress for carousels / onboarding.",
        render: () => <DotStepper steps={4} current={1} />,
      },
    ],
  },
  {
    id: "loaders",
    title: "Loaders & empty states",
    blurb: "Every async workflow needs visible loading, empty, error, and success states.",
    demos: [
      {
        name: "Spinner",
        description: "Inline indeterminate spinner.",
        render: () => (
          <Row>
            <Spinner size="sm" />
            <Spinner size="md" />
            <Spinner size="lg" />
          </Row>
        ),
      },
      {
        name: "SpinnerLoader",
        description: "Branded multi-dot loader for full-panel waits.",
        render: () => (
          <div className="max-w-xs">
            <SpinnerLoader inline />
          </div>
        ),
      },
      {
        name: "FancyLoader",
        description: "Premium animated loader for hero / splash waits (shown inline here).",
        render: () => <FancyLoader inline />,
      },
      {
        name: "Skeleton",
        description: "Content placeholder while data loads.",
        render: () => (
          <div className="max-w-xs space-y-2">
            <Skeleton className="h-4 w-3/4" />
            <Skeleton className="h-4 w-1/2" />
            <Skeleton className="h-20 w-full" />
          </div>
        ),
      },
      {
        name: "Shimmer",
        description: "Shimmer sweep overlay for loading surfaces.",
        render: () => (
          <div className="relative h-16 w-48 overflow-hidden rounded-xl bg-bg-weak-50">
            <Shimmer />
          </div>
        ),
      },
      {
        name: "ProgressCircle",
        description: "Circular percentage gauge. Primary tone + status tones.",
        render: () => (
          <Row>
            <ProgressCircle value={72} />
            <ProgressCircle value={42} tone="warning" size={56} />
            <ProgressCircle value={96} tone="success" size={56} />
          </Row>
        ),
      },
      {
        name: "EmptyState",
        description: "No-data state with illustration, copy, and a next action.",
        render: () => (
          <EmptyState className="max-w-sm">
            <EmptyStateIllustration kind="notes" />
            <EmptyStateTitle>No exceptions</EmptyStateTitle>
            <EmptyStateDescription>Every bag in this wave scanned clean.</EmptyStateDescription>
            <EmptyStateActions>
              <Button size="sm" leftIcon={<RiInboxLine />}>View wave</Button>
            </EmptyStateActions>
          </EmptyState>
        ),
      },
      {
        name: "EmptyStateIllustration",
        description: "Standalone illustration by kind (host serves /brand/empty-states/*.svg).",
        render: () => <EmptyStateIllustration kind="notes" size={120} />,
      },
      {
        name: "NotificationOnboarding",
        description: "First-run coachmark anchored to a control.",
        render: () => (
          <NotificationOnboarding>
            <IconButton aria-label="Notifications" tone="neutral" style="stroke">
              <RiNotification3Line />
            </IconButton>
          </NotificationOnboarding>
        ),
      },
    ],
  },
]

import { MORE_CATEGORIES } from "./registry.more"
import { MAP_CATEGORIES } from "./registry.maps"
import { CHART_CATEGORIES } from "./registry.charts"
import { TRACKING_CATEGORIES } from "./registry.tracking"

export const CATEGORIES: Category[] = [...BASE_CATEGORIES, ...MORE_CATEGORIES, ...MAP_CATEGORIES, ...TRACKING_CATEGORIES, ...CHART_CATEGORIES]

export const TOTAL_COMPONENTS = CATEGORIES.reduce((n, c) => n + c.demos.length, 0)
