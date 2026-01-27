import {
    LaptopOutlined,
    DesktopOutlined,
    DatabaseOutlined,
    ToolOutlined,
    PlusCircleOutlined,
    PauseCircleOutlined,
    ThunderboltOutlined,
    TabletOutlined,
    PrinterOutlined,
    UsbOutlined,
    HddOutlined,
    RightSquareOutlined,
} from "@ant-design/icons";

import { Keyboard, MemoryStick, Cpu, Gpu } from "lucide-react";

// Unified config for categories, peripherals, printers, and status
export const ITEM_CONFIG = {
    // Categories
    laptop: { color: "blue", icon: <LaptopOutlined /> },
    desktop: { color: "green", icon: <DesktopOutlined /> },
    tablet: { color: "cyan", icon: <TabletOutlined /> },
    server: { color: "gold", icon: <DatabaseOutlined /> },

    // Peripherals / Components
    monitor: { color: "blue", icon: <DesktopOutlined /> },
    mouse: { color: "green", icon: <UsbOutlined /> },
    keyboard: { color: "orange", icon: <Keyboard /> },
    ram: { color: "purple", icon: <MemoryStick /> },
    motherboard: { color: "cyan", icon: <Cpu /> },
    gpu: { color: "gold", icon: <Gpu /> },
    storage: { color: "red", icon: <HddOutlined /> },

    // Printers / Terminals
    "honeywell printer": { color: "blue", icon: <PrinterOutlined /> },
    "zebra printer": { color: "purple", icon: <PrinterOutlined /> },
    "consigned printer": { color: "green", icon: <PrinterOutlined /> },
    "promis terminal": { color: "purple", icon: <RightSquareOutlined /> },

    // Status
    new: { color: "purple", icon: <PlusCircleOutlined /> },
    inactive: { color: "volcano", icon: <PauseCircleOutlined /> },
    defective: { color: "red", icon: <ToolOutlined /> },

    // Default
    default: { color: "gray", icon: <ThunderboltOutlined /> },
};
