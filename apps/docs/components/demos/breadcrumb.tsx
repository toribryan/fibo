"use client"

import * as React from "react"
import { DatabaseIcon } from "lucide-react"

import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbMenuTrigger,
  BreadcrumbSeparator,
} from "@workspace/ui/components/breadcrumb"
import {
  Menu,
  MenuContent,
  MenuRadioGroup,
  MenuRadioItem,
} from "@workspace/ui/components/menu"

const databases = ["Orion", "Sigma", "Dorado"]

export function BreadcrumbMenuDemo() {
  const [database, setDatabase] = React.useState(databases[0])
  return (
    <Breadcrumb>
      <BreadcrumbList>
        <BreadcrumbItem>
          <BreadcrumbLink href="#">Acme</BreadcrumbLink>
        </BreadcrumbItem>
        <BreadcrumbSeparator />
        <BreadcrumbItem>
          <BreadcrumbLink href="#">Databases</BreadcrumbLink>
        </BreadcrumbItem>
        <BreadcrumbSeparator />
        <BreadcrumbItem>
          <Menu>
            <BreadcrumbMenuTrigger icon={<DatabaseIcon />}>
              {database}
            </BreadcrumbMenuTrigger>
            <MenuContent>
              <MenuRadioGroup
                value={database}
                onValueChange={(value) => setDatabase(value as string)}
              >
                {databases.map((name) => (
                  <MenuRadioItem key={name} value={name} closeOnClick>
                    {name}
                  </MenuRadioItem>
                ))}
              </MenuRadioGroup>
            </MenuContent>
          </Menu>
        </BreadcrumbItem>
      </BreadcrumbList>
    </Breadcrumb>
  )
}
