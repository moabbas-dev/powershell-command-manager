import type { LucideIcon } from 'lucide-react'
import {
  Activity, Archive, BookOpen, Box, Braces, Bug,
  Cloud, Code2, Cog, Container, Cpu, Database,
  FileCode2, Flame, FlaskConical, Folder, FolderCode,
  Gauge, GitBranch, Globe, Hammer, HardDrive,
  Key, Laptop, LayoutDashboard, Layers, Lock,
  Monitor, Network, Package, Play, Rocket, Router,
  Server, Settings, Shield, Star, Terminal, Wifi,
  Workflow, Wrench, Zap
} from 'lucide-react'

export interface GroupIconDef {
  name: string
  Icon: LucideIcon
  label: string
}

export const GROUP_ICONS: GroupIconDef[] = [
  // Infrastructure
  { name: 'Server',          Icon: Server,          label: 'Server'         },
  { name: 'Database',        Icon: Database,        label: 'Database'       },
  { name: 'Cloud',           Icon: Cloud,           label: 'Cloud'          },
  { name: 'Container',       Icon: Container,       label: 'Container'      },
  { name: 'Network',         Icon: Network,         label: 'Network'        },
  { name: 'Router',          Icon: Router,          label: 'Router'         },
  { name: 'Wifi',            Icon: Wifi,            label: 'Wifi'           },
  { name: 'HardDrive',       Icon: HardDrive,       label: 'Storage'        },
  { name: 'Cpu',             Icon: Cpu,             label: 'CPU'            },
  // Development
  { name: 'Terminal',        Icon: Terminal,        label: 'Terminal'       },
  { name: 'Code2',           Icon: Code2,           label: 'Code'           },
  { name: 'Braces',          Icon: Braces,          label: 'Braces'         },
  { name: 'FileCode2',       Icon: FileCode2,       label: 'File'           },
  { name: 'FolderCode',      Icon: FolderCode,      label: 'Project'        },
  { name: 'GitBranch',       Icon: GitBranch,       label: 'Git'            },
  { name: 'Bug',             Icon: Bug,             label: 'Debug'          },
  { name: 'FlaskConical',    Icon: FlaskConical,    label: 'Testing'        },
  { name: 'Workflow',        Icon: Workflow,        label: 'Workflow'       },
  // Tools
  { name: 'Wrench',          Icon: Wrench,          label: 'Wrench'         },
  { name: 'Hammer',          Icon: Hammer,          label: 'Hammer'         },
  { name: 'Settings',        Icon: Settings,        label: 'Settings'       },
  { name: 'Cog',             Icon: Cog,             label: 'Cog'            },
  { name: 'Gauge',           Icon: Gauge,           label: 'Metrics'        },
  // App types
  { name: 'Globe',           Icon: Globe,           label: 'Web'            },
  { name: 'Monitor',         Icon: Monitor,         label: 'Frontend'       },
  { name: 'Laptop',          Icon: Laptop,          label: 'Desktop'        },
  { name: 'LayoutDashboard', Icon: LayoutDashboard, label: 'Dashboard'      },
  { name: 'Rocket',          Icon: Rocket,          label: 'Deploy'         },
  { name: 'Package',         Icon: Package,         label: 'Package'        },
  // Misc
  { name: 'Zap',             Icon: Zap,             label: 'Zap'            },
  { name: 'Flame',           Icon: Flame,           label: 'Hot'            },
  { name: 'Activity',        Icon: Activity,        label: 'Activity'       },
  { name: 'Star',            Icon: Star,            label: 'Favorite'       },
  { name: 'Shield',          Icon: Shield,          label: 'Security'       },
  { name: 'Key',             Icon: Key,             label: 'Auth'           },
  { name: 'Lock',            Icon: Lock,            label: 'Lock'           },
  { name: 'Layers',          Icon: Layers,          label: 'Layers'         },
  { name: 'Box',             Icon: Box,             label: 'Box'            },
  { name: 'Folder',          Icon: Folder,          label: 'Folder'         },
  { name: 'Archive',         Icon: Archive,         label: 'Archive'        },
  { name: 'BookOpen',        Icon: BookOpen,        label: 'Docs'           },
  { name: 'Play',            Icon: Play,            label: 'Run'            },
]

/** Returns the Lucide component for a stored icon name, or null if not found. */
export function getGroupIcon(name: string | null): LucideIcon | null {
  if (!name) return null
  return GROUP_ICONS.find(g => g.name === name)?.Icon ?? null
}
