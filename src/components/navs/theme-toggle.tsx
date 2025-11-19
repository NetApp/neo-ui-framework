import { 
    IconMoon,
    IconSun
} from "@tabler/icons-react"

import { 
  Button 
} from "@/components/ui/button"

import { 
  useTheme 
} from "@/components/navs/theme-provider"

export function ModeToggle() {
  const { theme, setTheme } = useTheme()

  const toggleTheme = () => {
    if (theme === "system") {
      setTheme("light")
    } else if (theme === "light") {
      setTheme("dark")
    } else {
      setTheme("system")
    }
  }

  const getLabel = () => {
    if (theme === "system") return "System"
    return theme === "light" ? "Light" : "Dark"
  }

  return (
    <Button 
      variant="outline" 
      onClick={toggleTheme}
      className="gap-2"
    >
      <span className="relative inline-flex h-[1.2rem] w-[1.2rem]">
        <IconSun className="absolute h-[1.2rem] w-[1.2rem] scale-100 rotate-0 transition-all dark:scale-0 dark:-rotate-90" />
        <IconMoon className="absolute h-[1.2rem] w-[1.2rem] scale-0 rotate-90 transition-all dark:scale-100 dark:rotate-0" />
      </span>
      <span>{getLabel()}</span>
    </Button>
  )
}