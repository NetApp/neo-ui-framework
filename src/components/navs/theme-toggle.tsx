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
    if (theme === "light") {
      setTheme("dark")
    } else if (theme === "dark") {
      setTheme("light")
    } else {
      // If system theme, default to light
      setTheme("light")
    }
  }

  return (
    <Button variant="outline" size="icon" onClick={toggleTheme}>
      <IconSun className="h-[1.2rem] w-[1.2rem] scale-100 rotate-0 transition-all dark:scale-0 dark:-rotate-90" />
      <IconMoon className="absolute h-[1.2rem] w-[1.2rem] scale-0 rotate-90 transition-all dark:scale-100 dark:rotate-0" />
      <span className="sr-only">Toggle theme</span>
    </Button>
  )
}