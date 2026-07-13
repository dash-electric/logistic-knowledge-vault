import * as React from "react"
import type { Category } from "./registry"
import {
  Button,
  Modal, ModalTrigger, ModalContent, ModalHeader, ModalTitle, ModalDescription, ModalBody, ModalFooter, ModalClose,
  FormModal,
  AlertDialog, AlertDialogTrigger, AlertDialogContent, AlertDialogHeader, AlertDialogTitle, AlertDialogDescription, AlertDialogFooter, AlertDialogAction, AlertDialogCancel,
  Drawer, DrawerTrigger, DrawerContent, DrawerHeader, DrawerTitle, DrawerBody, DrawerFooter, DrawerClose,
  Sheet, SheetTrigger, SheetContent, SheetHeader, SheetTitle, SheetBody,
  Popover, PopoverTrigger, PopoverContent,
  HoverCard, HoverCardTrigger, HoverCardContent,
  Tooltip, TooltipTrigger, TooltipContent, TooltipProvider,
  Toaster, toast,
  DropdownMenu, DropdownMenuTrigger, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuSeparator,
  ContextMenu, ContextMenuTrigger, ContextMenuContent, ContextMenuItem, ContextMenuSeparator,
  Menubar, MenubarMenu, MenubarTrigger, MenubarContent, MenubarItem, MenubarSeparator,
  NavigationMenu, NavigationMenuList, NavigationMenuItem, NavigationMenuTrigger, NavigationMenuContent, NavigationMenuLink,
  Select, SelectTrigger, SelectValue, SelectContent, SelectItem, SelectGroup, SelectLabel,
  Combobox,
  Command, CommandInput, CommandList, CommandEmpty, CommandGroup, CommandItem,
  LanguageSelect,
  SegmentedControl, SegmentedItem,
  Checkbox, CheckboxField,
  Table, TableHeader, TableBody, TableRow, TableHead, TableCell,
  Badge,
  RadioGroup, RadioField,
  Switch,
  Slider,
  Toggle,
  ToggleGroup, ToggleGroupItem,
  InputOTP, InputOTPGroup, InputOTPSlot, InputOTPSeparator,
  ColorPicker,
  Calendar,
  DatePicker,
  Accordion, AccordionItem, AccordionTrigger, AccordionContent,
  Collapsible, CollapsibleTrigger, CollapsibleContent,
  Tabs, TabsList, TabsTrigger, TabsContent,
  Divider,
  AspectRatio,
  ScrollArea,
  ResizablePanelGroup, ResizablePanel, ResizableHandle,
  Carousel, CarouselContent, CarouselItem, CarouselPrevious, CarouselNext,
  DataTable,
  ChartContainer, ChartTooltip, ChartTooltipContent,
  ProgressBar, ProgressBarLabel,
  Avatar, AvatarFallback, AvatarImage, AvatarGroup,
  AvailabilityStatus,
  ActivityFeed, ActivityFeedItem,
  NotificationFeed, NotificationItem, NotificationAvatar, NotificationAvatarFallback,
  BulkActionBar,
  Filter,
  UploadCard,
  ThemeSwitch,
} from "@dash-electric/logistic-kit"
import {
  RiBold, RiItalic, RiUnderline, RiMoreLine, RiBox3Line, RiTruckLine, RiMapPin2Line, RiBardLine, RiEditLine,
} from "@remixicon/react"
import { Bar, BarChart, XAxis } from "recharts"

const Row = ({ children }: { children: React.ReactNode }) => (
  <div className="flex flex-wrap items-center gap-3">{children}</div>
)

// react-resizable-panels v4 types don't surface `direction` through the kit
// wrapper's inferred props; cast for the demo (passed through at runtime).
const RPG = ResizablePanelGroup as React.ComponentType<Record<string, unknown>>

/* ── stateful demo components (real components → hook-safe) ───────────── */
function SwitchDemo() {
  const [on, setOn] = React.useState(true)
  return (
    <Row>
      <Switch checked={on} onCheckedChange={setOn} />
      <span className="text-sm text-text-sub-600">{on ? "Auto-assign on" : "Auto-assign off"}</span>
    </Row>
  )
}
function SliderDemo() {
  const [v, setV] = React.useState([40])
  return (
    <div className="max-w-xs">
      <Slider value={v} onValueChange={setV} max={100} step={1} />
      <p className="mt-2 text-sm tabular-nums text-text-sub-600">Max weight: {v[0]} kg</p>
    </div>
  )
}
function ComboboxDemo() {
  const [v, setV] = React.useState("")
  return (
    <div className="max-w-xs">
      <Combobox
        value={v}
        onValueChange={setV}
        placeholder="Pick a hub…"
        options={[
          { value: "cgk-01", label: "JKT · CGK-01" },
          { value: "cgk-02", label: "JKT · CGK-02" },
          { value: "sub-01", label: "SUB · Surabaya-01" },
          { value: "dps-01", label: "DPS · Denpasar-01" },
        ]}
      />
    </div>
  )
}
function SegmentedDemo() {
  const [v, setV] = React.useState("day")
  return (
    <SegmentedControl value={v} onValueChange={setV}>
      <SegmentedItem value="day">Day</SegmentedItem>
      <SegmentedItem value="week">Week</SegmentedItem>
      <SegmentedItem value="month">Month</SegmentedItem>
    </SegmentedControl>
  )
}
function FilterDemo() {
  const [v, setV] = React.useState<string[]>(["same-day"])
  return (
    <Filter
      label="Service"
      value={v}
      onValueChange={setV}
      options={[
        { value: "same-day", label: "Same-day" },
        { value: "next-day", label: "Next-day" },
        { value: "cod", label: "COD" },
      ]}
    />
  )
}
function LanguageDemo() {
  const [v, setV] = React.useState("id")
  return <LanguageSelect value={v} onLocaleChange={setV} />
}
function CalendarDemo() {
  const [d, setD] = React.useState<Date | undefined>(new Date(2026, 5, 27))
  return <Calendar mode="single" selected={d} onSelect={setD} />
}
function DatePickerDemo() {
  const [d, setD] = React.useState<Date | undefined>()
  return <div className="max-w-xs"><DatePicker value={d} onValueChange={setD} /></div>
}
function ColorPickerDemo() {
  const [c, setC] = React.useState("#5E2AAC")
  return <ColorPicker value={c} onValueChange={setC} />
}
function OtpDemo() {
  const [v, setV] = React.useState("")
  return (
    <InputOTP maxLength={4} value={v} onChange={setV}>
      <InputOTPGroup>
        <InputOTPSlot index={0} />
        <InputOTPSlot index={1} />
        <InputOTPSeparator />
        <InputOTPSlot index={2} />
        <InputOTPSlot index={3} />
      </InputOTPGroup>
    </InputOTP>
  )
}
function TogglePressDemo() {
  return (
    <Row>
      <Toggle aria-label="Bold"><RiBold /></Toggle>
      <ToggleGroup type="multiple" defaultValue={["bold"]}>
        <ToggleGroupItem value="bold" aria-label="Bold"><RiBold /></ToggleGroupItem>
        <ToggleGroupItem value="italic" aria-label="Italic"><RiItalic /></ToggleGroupItem>
        <ToggleGroupItem value="underline" aria-label="Underline"><RiUnderline /></ToggleGroupItem>
      </ToggleGroup>
    </Row>
  )
}

/* Selectable table + BulkActionBar-on-selection */
type SelRow = { id: string; status: "information" | "success" | "warning" | "error"; label: string; stops: number }
const selRows: SelRow[] = [
  { id: "BAG-90213", status: "information", label: "In transit", stops: 12 },
  { id: "BAG-90214", status: "success", label: "Delivered", stops: 8 },
  { id: "BAG-90215", status: "warning", label: "Delayed", stops: 5 },
  { id: "BAG-90216", status: "information", label: "In transit", stops: 9 },
  { id: "BAG-90217", status: "error", label: "Failed", stops: 3 },
  { id: "BAG-90218", status: "success", label: "Delivered", stops: 14 },
  { id: "BAG-90219", status: "information", label: "In transit", stops: 7 },
  { id: "BAG-90220", status: "warning", label: "Delayed", stops: 6 },
  { id: "BAG-90221", status: "success", label: "Delivered", stops: 11 },
  { id: "BAG-90222", status: "information", label: "In transit", stops: 4 },
]
function SelectableTableDemo() {
  const [sel, setSel] = React.useState<Set<string>>(new Set())
  const allSel = sel.size === selRows.length
  const someSel = sel.size > 0 && !allSel
  const toggleAll = () => setSel(allSel ? new Set() : new Set(selRows.map((r) => r.id)))
  const toggleOne = (id: string) =>
    setSel((prev) => {
      const next = new Set(prev)
      next.has(id) ? next.delete(id) : next.add(id)
      return next
    })
  return (
    <div className="max-w-xl">
      <Table containerClassName="max-h-64 rounded-sm border border-stroke-soft-200">
        <TableHeader sticky>
          <TableRow>
            <TableHead className="w-10">
              <Checkbox
                checked={allSel ? true : someSel ? "indeterminate" : false}
                onCheckedChange={toggleAll}
                aria-label="Select all rows"
              />
            </TableHead>
            <TableHead>Bag ID</TableHead>
            <TableHead>Status</TableHead>
            <TableHead className="text-right">Stops</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {selRows.map((r) => (
            <TableRow key={r.id} data-state={sel.has(r.id) ? "selected" : undefined}>
              <TableCell>
                <Checkbox
                  checked={sel.has(r.id)}
                  onCheckedChange={() => toggleOne(r.id)}
                  aria-label={`Select ${r.id}`}
                />
              </TableCell>
              <TableCell className="font-mono">{r.id}</TableCell>
              <TableCell><Badge status={r.status} type="dot">{r.label}</Badge></TableCell>
              <TableCell className="text-right tabular">{r.stops}</TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
      {sel.size > 0 && (
        <BulkActionBar
          selectedCount={sel.size}
          onClear={() => setSel(new Set())}
          actions={[
            { id: "reassign", label: "Reassign", onClick: () => {} },
            { id: "hold", label: "Hold at hub", onClick: () => {} },
            { id: "cancel", label: "Cancel", tone: "destructive", onClick: () => {} },
          ]}
        />
      )}
    </div>
  )
}
function BulkActionBarToggleDemo() {
  const [open, setOpen] = React.useState(false)
  return (
    <div>
      <Button tone="neutral" style="stroke" onClick={() => setOpen(true)}>Simulate 3 selected</Button>
      {open && (
        <BulkActionBar
          selectedCount={3}
          onClear={() => setOpen(false)}
          actions={[
            { id: "reassign", label: "Reassign", onClick: () => {} },
            { id: "hold", label: "Hold at hub", onClick: () => {} },
            { id: "cancel", label: "Cancel", tone: "destructive", onClick: () => {} },
          ]}
        />
      )}
    </div>
  )
}

/* DataTable demo */
type BagRow = { id: string; status: string; stops: number }
const bagColumns = [
  { accessorKey: "id", header: "Bag ID" },
  { accessorKey: "status", header: "Status" },
  { accessorKey: "stops", header: "Stops" },
]
const bagData: BagRow[] = [
  { id: "BAG-90213", status: "In transit", stops: 12 },
  { id: "BAG-90214", status: "Delivered", stops: 8 },
  { id: "BAG-90215", status: "At hub", stops: 5 },
]

/* Chart demo */
const chartData = [
  { d: "Mon", v: 186 }, { d: "Tue", v: 221 }, { d: "Wed", v: 198 },
  { d: "Thu", v: 243 }, { d: "Fri", v: 312 }, { d: "Sat", v: 274 },
]

export const MORE_CATEGORIES: Category[] = [
  {
    id: "overlays",
    title: "Overlays & dialogs",
    blurb: "Floating surfaces get the gentlest hairline lift + a 45% ink scrim with dismissal blur. Click a trigger to open.",
    demos: [
      {
        name: "Modal",
        description: "Focused dialog for short flows. Esc / overlay / close all dismiss.",
        render: () => (
          <Modal>
            <ModalTrigger asChild><Button tone="neutral" style="stroke">Open modal</Button></ModalTrigger>
            <ModalContent>
              <ModalHeader><ModalTitle>Reassign batch</ModalTitle><ModalDescription>Move Wave 14 to a different hub.</ModalDescription></ModalHeader>
              <ModalBody><p className="text-sm text-text-sub-600">312 bags will be re-sorted at the destination hub.</p></ModalBody>
              <ModalFooter>
                <ModalClose asChild><Button tone="neutral" style="stroke">Cancel</Button></ModalClose>
                <Button>Reassign</Button>
              </ModalFooter>
            </ModalContent>
          </Modal>
        ),
      },
      {
        name: "FormModal",
        description: "Batteries-included dialog shell for CRUD forms: icon-chip header, footer strip, center or right position, and a confirmOnClose guard that intercepts Esc / backdrop / \u2715 with an inline discard confirmation.",
        render: function FormModalDemo() {
          const [open, setOpen] = React.useState(false)
          return (
            <>
              <Button tone="neutral" style="stroke" onClick={() => setOpen(true)}>
                Open form modal
              </Button>
              <FormModal
                open={open}
                onClose={() => setOpen(false)}
                title="Edit hub"
                subtitle="CGK-01 \u00b7 Kemang"
                icon={<RiEditLine />}
                size="md"
                confirmOnClose
                footer={
                  <div className="flex items-center justify-end gap-2">
                    <Button tone="neutral" style="stroke" size="sm" onClick={() => setOpen(false)}>
                      Cancel
                    </Button>
                    <Button size="sm" onClick={() => setOpen(false)}>Save changes</Button>
                  </div>
                }
              >
                <p className="text-sm text-text-sub-600">
                  Try Esc or a backdrop click \u2014 the discard guard intercepts every close path.
                </p>
              </FormModal>
            </>
          )
        },
      },
      {
        name: "AlertDialog",
        description: "Confirmation gate for destructive actions.",
        render: () => (
          <AlertDialog>
            <AlertDialogTrigger asChild><Button tone="destructive" style="stroke">Cancel pickup</Button></AlertDialogTrigger>
            <AlertDialogContent>
              <AlertDialogHeader><AlertDialogTitle>Cancel this pickup?</AlertDialogTitle><AlertDialogDescription>The driver will be unassigned. This can't be undone.</AlertDialogDescription></AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>Keep</AlertDialogCancel>
                <AlertDialogAction>Cancel pickup</AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        ),
      },
      {
        name: "Drawer",
        description: "Side panel for detail / secondary flows.",
        render: () => (
          <Drawer>
            <DrawerTrigger asChild><Button tone="neutral" style="stroke">Open drawer</Button></DrawerTrigger>
            <DrawerContent>
              <DrawerHeader><DrawerTitle>Bag BAG-90213</DrawerTitle></DrawerHeader>
              <DrawerBody><p className="text-sm text-text-sub-600">12 stops · in transit · ETA 16:40.</p></DrawerBody>
              <DrawerFooter><DrawerClose asChild><Button tone="neutral" style="stroke">Close</Button></DrawerClose></DrawerFooter>
            </DrawerContent>
          </Drawer>
        ),
      },
      {
        name: "Sheet",
        description: "Edge-anchored sheet (filters, quick edit).",
        render: () => (
          <Sheet>
            <SheetTrigger asChild><Button tone="neutral" style="stroke">Open sheet</Button></SheetTrigger>
            <SheetContent>
              <SheetHeader><SheetTitle>Filters</SheetTitle></SheetHeader>
              <SheetBody><p className="text-sm text-text-sub-600">Narrow the manifest by hub, service, and status.</p></SheetBody>
            </SheetContent>
          </Sheet>
        ),
      },
      {
        name: "Popover",
        description: "Lightweight floating panel anchored to a trigger.",
        render: () => (
          <Popover>
            <PopoverTrigger asChild><Button tone="neutral" style="stroke">Quick note</Button></PopoverTrigger>
            <PopoverContent className="w-64"><p className="text-sm text-text-sub-600">Recipient not home — left with security at 15:20.</p></PopoverContent>
          </Popover>
        ),
      },
      {
        name: "HoverCard",
        description: "Hover-revealed preview card.",
        render: () => (
          <HoverCard>
            <HoverCardTrigger asChild><Button style="link">@driver-204</Button></HoverCardTrigger>
            <HoverCardContent className="w-64"><p className="text-sm text-text-strong-950">Andi · 4.9★ · 1,204 trips</p></HoverCardContent>
          </HoverCard>
        ),
      },
      {
        name: "Tooltip",
        description: "Pointer/focus hint on a control.",
        render: () => (
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild><Button tone="neutral" style="stroke">Hover me</Button></TooltipTrigger>
              <TooltipContent>Sorts by ETA, ascending</TooltipContent>
            </Tooltip>
          </TooltipProvider>
        ),
      },
      {
        name: "Toaster · toast()",
        description: "Transient confirmation (auto-dismiss, aria-live).",
        render: () => (
          <>
            <Toaster />
            <Button tone="neutral" style="stroke" onClick={() => toast("Wave dispatched")}>Show toast</Button>
          </>
        ),
      },
    ],
  },
  {
    id: "menus",
    title: "Menus & selection",
    blurb: "Dropdowns, command palette, and searchable selects. Active/selected states use purple as punctuation.",
    demos: [
      {
        name: "DropdownMenu",
        description: "Action menu off a trigger.",
        render: () => (
          <DropdownMenu>
            <DropdownMenuTrigger asChild><Button tone="neutral" style="stroke" rightIcon={<RiMoreLine />}>Actions</Button></DropdownMenuTrigger>
            <DropdownMenuContent>
              <DropdownMenuLabel>Bag</DropdownMenuLabel>
              <DropdownMenuItem>Reassign</DropdownMenuItem>
              <DropdownMenuItem>Hold at hub</DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem>View audit trail</DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        ),
      },
      {
        name: "ContextMenu",
        description: "Right-click menu on a surface.",
        render: () => (
          <ContextMenu>
            <ContextMenuTrigger className="flex h-20 items-center justify-center rounded-sm border border-dashed border-stroke-sub-300 text-sm text-text-sub-600">
              Right-click here
            </ContextMenuTrigger>
            <ContextMenuContent>
              <ContextMenuItem>Open</ContextMenuItem>
              <ContextMenuItem>Duplicate</ContextMenuItem>
              <ContextMenuSeparator />
              <ContextMenuItem>Delete</ContextMenuItem>
            </ContextMenuContent>
          </ContextMenu>
        ),
      },
      {
        name: "Menubar",
        description: "Desktop-style menu bar.",
        render: () => (
          <Menubar>
            <MenubarMenu>
              <MenubarTrigger>Manifest</MenubarTrigger>
              <MenubarContent>
                <MenubarItem>Export CSV</MenubarItem>
                <MenubarSeparator />
                <MenubarItem>Print</MenubarItem>
              </MenubarContent>
            </MenubarMenu>
            <MenubarMenu>
              <MenubarTrigger>View</MenubarTrigger>
              <MenubarContent><MenubarItem>Compact rows</MenubarItem></MenubarContent>
            </MenubarMenu>
          </Menubar>
        ),
      },
      {
        name: "NavigationMenu",
        description: "Top-level nav with flyout content.",
        render: () => (
          <NavigationMenu>
            <NavigationMenuList>
              <NavigationMenuItem>
                <NavigationMenuTrigger>Operations</NavigationMenuTrigger>
                <NavigationMenuContent>
                  <div className="grid w-56 gap-1 p-2">
                    <NavigationMenuLink>Waves</NavigationMenuLink>
                    <NavigationMenuLink>Hubs</NavigationMenuLink>
                    <NavigationMenuLink>Routes</NavigationMenuLink>
                  </div>
                </NavigationMenuContent>
              </NavigationMenuItem>
            </NavigationMenuList>
          </NavigationMenu>
        ),
      },
      {
        name: "Select",
        description: "Native-feel single select.",
        render: () => (
          <div className="max-w-xs">
            <Select defaultValue="cgk-01">
              <SelectTrigger><SelectValue placeholder="Hub" /></SelectTrigger>
              <SelectContent>
                <SelectGroup>
                  <SelectLabel>Jakarta</SelectLabel>
                  <SelectItem value="cgk-01">CGK-01</SelectItem>
                  <SelectItem value="cgk-02">CGK-02</SelectItem>
                </SelectGroup>
              </SelectContent>
            </Select>
          </div>
        ),
      },
      { name: "Combobox", description: "Single select WITH search (type to filter).", render: () => <ComboboxDemo /> },
      {
        name: "Command",
        description: "Command / search palette (cmdk).",
        render: () => (
          <div className="max-w-sm rounded-sm border border-stroke-soft-200">
            <Command>
              <CommandInput placeholder="Search actions…" />
              <CommandList>
                <CommandEmpty>No results.</CommandEmpty>
                <CommandGroup heading="Bags">
                  <CommandItem>Search bag</CommandItem>
                  <CommandItem>Reassign batch</CommandItem>
                  <CommandItem>Print manifest</CommandItem>
                </CommandGroup>
              </CommandList>
            </Command>
          </div>
        ),
      },
      { name: "LanguageSelect", description: "Locale switcher.", render: () => <div className="max-w-xs"><LanguageDemo /></div> },
      { name: "SegmentedControl", description: "Mode switch (segmented).", render: () => <SegmentedDemo /> },
    ],
  },
  {
    id: "controls",
    title: "Form controls",
    blurb: "Selection states use Dash Purple as punctuation (checked, on, selected) — allowed by the GSM.",
    demos: [
      {
        name: "Checkbox · CheckboxField",
        description: "Boolean control + labeled field.",
        render: () => (
          <div className="space-y-2">
            <Row><Checkbox defaultChecked /> <Checkbox /></Row>
            <CheckboxField defaultChecked label="Require proof of delivery" description="Driver must capture a POD photo." />
          </div>
        ),
      },
      {
        name: "Radio · RadioField",
        description: "Single-choice group.",
        render: () => (
          <RadioGroup defaultValue="standard" className="space-y-2">
            <RadioField value="standard" label="Standard" description="Next-day delivery" />
            <RadioField value="express" label="Express" description="Same-day delivery" />
          </RadioGroup>
        ),
      },
      { name: "Switch", description: "Binary setting toggle.", render: () => <SwitchDemo /> },
      { name: "Slider", description: "Range input with tabular readout.", render: () => <SliderDemo /> },
      { name: "Toggle · ToggleGroup", description: "Pressed-state buttons.", render: () => <TogglePressDemo /> },
      { name: "InputOTP", description: "One-time-code / PIN entry.", render: () => <OtpDemo /> },
      { name: "ColorPicker", description: "Zone-color picker (functional gradients allowed).", render: () => <ColorPickerDemo /> },
      { name: "Calendar", description: "Date grid (react-day-picker).", render: () => <CalendarDemo /> },
      { name: "DatePicker", description: "Popover date field.", render: () => <DatePickerDemo /> },
    ],
  },
  {
    id: "disclosure",
    title: "Disclosure & layout",
    blurb: "Expanders, tabs, and layout primitives. Hairline rules separate ideas; corners stay sharp.",
    demos: [
      {
        name: "Accordion",
        description: "Stacked expandable sections.",
        render: () => (
          <Accordion type="single" collapsible className="max-w-md">
            <AccordionItem value="a"><AccordionTrigger>What is a wave?</AccordionTrigger><AccordionContent>A batch of bags sorted for one dispatch cycle.</AccordionContent></AccordionItem>
            <AccordionItem value="b"><AccordionTrigger>What is dwell time?</AccordionTrigger><AccordionContent>Seconds a bag waits at a hub before its next leg.</AccordionContent></AccordionItem>
          </Accordion>
        ),
      },
      {
        name: "Collapsible",
        description: "Single show/hide region.",
        render: () => (
          <Collapsible className="max-w-md">
            <CollapsibleTrigger asChild><Button tone="neutral" style="stroke">Toggle details</Button></CollapsibleTrigger>
            <CollapsibleContent className="mt-2 text-sm text-text-sub-600">Origin CGK-01 · cutoff 21:00 · 312 bags.</CollapsibleContent>
          </Collapsible>
        ),
      },
      {
        name: "Tabs",
        description: "Switch between views.",
        render: () => (
          <Tabs defaultValue="active" className="max-w-md">
            <TabsList>
              <TabsTrigger value="active">Active</TabsTrigger>
              <TabsTrigger value="done">Delivered</TabsTrigger>
              <TabsTrigger value="exc">Exceptions</TabsTrigger>
            </TabsList>
            <TabsContent value="active" className="pt-3 text-sm text-text-sub-600">94 bags in transit.</TabsContent>
            <TabsContent value="done" className="pt-3 text-sm text-text-sub-600">218 delivered today.</TabsContent>
            <TabsContent value="exc" className="pt-3 text-sm text-text-sub-600">0 exceptions.</TabsContent>
          </Tabs>
        ),
      },
      {
        name: "Divider",
        description: "Hairline rule (10% / 22% black).",
        render: () => (
          <div className="max-w-sm">
            <p className="text-sm text-text-strong-950">Origin</p>
            <Divider className="my-2" />
            <p className="text-sm text-text-strong-950">Destination</p>
          </div>
        ),
      },
      {
        name: "AspectRatio",
        description: "Locks a ratio (maps/photos).",
        render: () => (
          <div className="w-48">
            <AspectRatio ratio={16 / 9} className="rounded-sm bg-bg-weak-50">
              <div className="flex h-full items-center justify-center text-xs text-text-soft-400">16 : 9</div>
            </AspectRatio>
          </div>
        ),
      },
      {
        name: "ScrollArea",
        description: "Styled scroll container.",
        render: () => (
          <ScrollArea className="h-28 w-56 rounded-sm border border-stroke-soft-200 p-3">
            <div className="space-y-1 text-sm text-text-sub-600">
              {Array.from({ length: 12 }, (_, i) => <p key={i}>Stop {i + 1} · Jl. Sudirman {i + 1}</p>)}
            </div>
          </ScrollArea>
        ),
      },
      {
        name: "Resizable",
        description: "Draggable split panes.",
        render: () => (
          <RPG direction="horizontal" className="h-28 max-w-md rounded-sm border border-stroke-soft-200">
            <ResizablePanel defaultSize={50}><div className="flex h-full items-center justify-center text-sm text-text-sub-600">List</div></ResizablePanel>
            <ResizableHandle withHandle />
            <ResizablePanel defaultSize={50}><div className="flex h-full items-center justify-center text-sm text-text-sub-600">Map</div></ResizablePanel>
          </RPG>
        ),
      },
      {
        name: "Carousel",
        description: "Horizontal slide group (embla).",
        render: () => (
          <Carousel className="max-w-xs">
            <CarouselContent>
              {["CGK-01", "CGK-02", "SUB-01"].map((h) => (
                <CarouselItem key={h} className="basis-1/2">
                  <div className="flex h-20 items-center justify-center rounded-sm border border-stroke-soft-200 text-sm text-text-strong-950">{h}</div>
                </CarouselItem>
              ))}
            </CarouselContent>
            <CarouselPrevious />
            <CarouselNext />
          </Carousel>
        ),
      },
    ],
  },
  {
    id: "data-extra",
    title: "Data, feedback & theming",
    blurb: "Tables, charts, presence, and feeds. Chart fills are data-viz, exempt from the no-gradient rule.",
    demos: [
      { name: "DataTable", description: "Sortable/paginated table (TanStack).", render: () => <div className="max-w-xl"><DataTable columns={bagColumns} data={bagData} /></div> },
      {
        name: "Selectable table",
        description: "Row selection + sticky header (scroll the rows) + BulkActionBar that opens on selection. Tick rows to see it.",
        render: () => <SelectableTableDemo />,
      },
      {
        name: "Chart",
        description: "Recharts wrapper with themed tooltip.",
        render: () => (
          <ChartContainer config={{ v: { label: "Bags", color: "var(--dash-purple-500)" } }} className="h-40 w-full max-w-md">
            <BarChart data={chartData}>
              <XAxis dataKey="d" tickLine={false} axisLine={false} fontSize={12} />
              <ChartTooltip content={<ChartTooltipContent />} />
              <Bar dataKey="v" fill="var(--color-v)" radius={2} />
            </BarChart>
          </ChartContainer>
        ),
      },
      {
        name: "ProgressBar",
        description: "Linear progress + label.",
        render: () => (
          <div className="max-w-xs space-y-1">
            <ProgressBarLabel label="Sorted · 218 / 312" />
            <ProgressBar value={70} />
          </div>
        ),
      },
      {
        name: "Avatar · AvatarGroup",
        description: "User/driver avatars with fallback.",
        render: () => (
          <Row>
            <Avatar><AvatarImage src="/brand/dash.svg" alt="" /><AvatarFallback>AN</AvatarFallback></Avatar>
            <Avatar><AvatarFallback>RW</AvatarFallback></Avatar>
            <AvatarGroup>
              <Avatar><AvatarFallback>A</AvatarFallback></Avatar>
              <Avatar><AvatarFallback>B</AvatarFallback></Avatar>
              <Avatar><AvatarFallback>C</AvatarFallback></Avatar>
            </AvatarGroup>
          </Row>
        ),
      },
      {
        name: "AvailabilityStatus",
        description: "Up/down presence dot with tooltip.",
        render: () => (
          <Row>
            <AvailabilityStatus status="available" label="Hub online" />
            <AvailabilityStatus status="unavailable" label="Hub offline" />
          </Row>
        ),
      },
      {
        name: "ActivityFeed",
        description: "Chronological event stream.",
        render: () => (
          <ActivityFeed className="max-w-md">
            <ActivityFeedItem user={{ name: "Scanner", initials: "SC" }} action="scanned" target="BAG-90213 at CGK-01" timestamp="2m ago" />
            <ActivityFeedItem user={{ name: "Driver-204", initials: "AN" }} action="picked up" target="wave 14" timestamp="18m ago" />
            <ActivityFeedItem user={{ name: "System", initials: "SY" }} action="marked" target="out for delivery" timestamp="1h ago" />
          </ActivityFeed>
        ),
      },
      {
        name: "NotificationFeed",
        description: "Read/unread notification list.",
        render: () => (
          <NotificationFeed className="max-w-md">
            <NotificationItem
              unread
              avatar={<NotificationAvatar><NotificationAvatarFallback>AN</NotificationAvatarFallback></NotificationAvatar>}
              title="Andi accepted your delivery"
              timestamp="2m"
            />
            <NotificationItem
              avatar={<NotificationAvatar><NotificationAvatarFallback>SY</NotificationAvatarFallback></NotificationAvatar>}
              title="SLA breach risk on wave 12"
              timestamp="20m"
            />
          </NotificationFeed>
        ),
      },
      {
        name: "BulkActionBar",
        description: "Selection action bar — fixed to the viewport bottom, opens only when rows are selected (see Selectable table). Click to preview.",
        render: () => <BulkActionBarToggleDemo />,
      },
      { name: "Filter", description: "Multi-select filter chip + popover.", render: () => <FilterDemo /> },
      {
        name: "UploadCard",
        description: "Per-file upload row (uploading / done / failed).",
        render: () => (
          <div className="max-w-md space-y-2">
            <UploadCard fileName="manifest-w14.pdf" fileSizeKB={284} totalSizeKB={284} status="completed" />
            <UploadCard fileName="pod-90213.jpg" fileSizeKB={769} totalSizeKB={1240} status="uploading" progress={62} />
            <UploadCard fileName="pod-90214.jpg" fileSizeKB={980} totalSizeKB={980} status="failed" />
          </div>
        ),
      },
      {
        name: "ThemeSwitch",
        description: "Light/dark toggle control.",
        render: () => <Row><ThemeSwitch /></Row>,
      },
    ],
  },
]
