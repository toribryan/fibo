import React, { useEffect } from "react";
import type { Preview } from "@storybook/react-vite";

import "@workspace/ui/globals.css";

const preview: Preview = {
  parameters: {
    controls: {
      matchers: {
        color: /(background|color)$/i,
        date: /Date$/i,
      },
    },
    a11y: {
      test: "todo",
    },
    backgrounds: {
      disable: true,
    },
  },
  globalTypes: {
    theme: {
      description: "Design system color mode",
      toolbar: {
        title: "Theme",
        icon: "circlehollow",
        items: [
          { value: "light", icon: "sun", title: "Light" },
          { value: "dark", icon: "moon", title: "Dark" },
        ],
        dynamicTitle: true,
      },
    },
  },
  initialGlobals: {
    theme: "light",
  },
  decorators: [
    (Story, context) => {
      const theme = context.globals.theme ?? "light";

      useEffect(() => {
        document.documentElement.classList.toggle("dark", theme === "dark");
      }, [theme]);

      return (
        <div className="bg-background text-foreground min-h-24 p-6">
          <Story />
        </div>
      );
    },
  ],
};

export default preview;
