<script lang="ts">
  import * as Breadcrumb from '$lib/components/ui/breadcrumb/index.js';
  import SecondarySidebarTrigger from '$lib/components/secondary-sidebar-trigger.svelte';
  import { Separator } from '$lib/components/ui/separator/index.js';
  import { Tabs, TabsList, TabsTrigger, TabsContent } from '$lib/components/ui/tabs/index.js';
  import {
    Card,
    CardContent,
    CardHeader,
    CardTitle,
    CardDescription,
  } from '$lib/components/ui/card/index.js';
  import FontSizeSetting from '$lib/components/settings/font-size-setting.svelte';
  import FontFamilySetting from '$lib/components/settings/font-family-setting.svelte';
  import SidebarWidthSetting from '$lib/components/settings/sidebar-width-setting.svelte';
  import MessageDensitySetting from '$lib/components/settings/message-density-setting.svelte';
  import SettingsPreview from '$lib/components/settings/settings-preview.svelte';
  import PaletteIcon from '@lucide/svelte/icons/palette';
  import SettingsIcon from '@lucide/svelte/icons/settings';
  import SlidersHorizontalIcon from '@lucide/svelte/icons/sliders-horizontal';

  let activeTab = $state('general');

  function handleTabChange(value: string) {
    activeTab = value;
  }
</script>

<header class="bg-background sticky top-0 z-10 flex shrink-0 items-center gap-2 border-b p-4">
  <SecondarySidebarTrigger class="-ms-1" />
  <Separator orientation="vertical" class="me-2 data-[orientation=vertical]:h-4" />
  <Breadcrumb.Root>
    <Breadcrumb.List>
      <Breadcrumb.Item>
        <Breadcrumb.Link href="/app/settings">Settings</Breadcrumb.Link>
      </Breadcrumb.Item>
      <Breadcrumb.Separator />
      <Breadcrumb.Item>
        <Breadcrumb.Page>Appearance</Breadcrumb.Page>
      </Breadcrumb.Item>
    </Breadcrumb.List>
  </Breadcrumb.Root>
</header>

<div class="flex h-[calc(100vh-61px)]">
  <main class="flex-1 overflow-auto p-6">
    <div class="mx-auto max-w-5xl">
      <div class="mb-8">
        <h1 class="text-foreground mb-2 text-3xl font-bold">Appearance Settings</h1>
        <p class="text-muted-foreground">
          Customize your interface with fonts, spacing, themes, and more
        </p>
      </div>

      <!-- Tabs Navigation -->
      <Tabs value={activeTab} onValueChange={handleTabChange}>
        <TabsList>
          <TabsTrigger value="general">
            <SlidersHorizontalIcon class="size-4" />
            <span class="ml-2">General</span>
          </TabsTrigger>
          <TabsTrigger value="themes">
            <PaletteIcon class="size-4" />
            <span class="ml-2">Themes</span>
          </TabsTrigger>
          <TabsTrigger value="advanced">
            <SettingsIcon class="size-4" />
            <span class="ml-2">Advanced</span>
          </TabsTrigger>
        </TabsList>

        <!-- General Tab -->
        <TabsContent value="general">
          <div class="space-y-6">
            <!-- Typography Section -->
            <Card>
              <CardHeader>
                <CardTitle>Typography</CardTitle>
                <CardDescription>
                  Adjust font size and font family for better readability
                </CardDescription>
              </CardHeader>
              <CardContent class="space-y-6">
                <FontSizeSetting />
                <Separator />
                <FontFamilySetting />
              </CardContent>
            </Card>

            <!-- Layout Section -->
            <Card>
              <CardHeader>
                <CardTitle>Layout & Spacing</CardTitle>
                <CardDescription>
                  Customize sidebar width and message density to suit your workflow
                </CardDescription>
              </CardHeader>
              <CardContent class="space-y-6">
                <SidebarWidthSetting />
                <Separator />
                <MessageDensitySetting />
              </CardContent>
            </Card>

            <!-- Live Preview Section -->
            <SettingsPreview />
          </div>
        </TabsContent>

        <!-- Themes Tab -->
        <TabsContent value="themes">
          <Card>
            <CardHeader>
              <CardTitle>Theme Selection</CardTitle>
              <CardDescription>
                Choose from built-in themes or create your own custom theme (coming soon)
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div
                class="flex min-h-[200px] items-center justify-center rounded-lg border-2 border-dashed p-8 text-center"
              >
                <div>
                  <PaletteIcon class="text-muted-foreground mx-auto mb-4 size-12" />
                  <h3 class="text-foreground text-lg font-semibold">Theme Switcher</h3>
                  <p class="text-muted-foreground mt-2 text-sm">
                    The theme switcher will be available in the next update.
                    <br />
                    You'll be able to choose from built-in themes and create custom themes.
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <!-- Advanced Tab -->
        <TabsContent value="advanced">
          <Card>
            <CardHeader>
              <CardTitle>Advanced Options</CardTitle>
              <CardDescription>
                Reset settings to defaults or export/import configurations (coming soon)
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div
                class="flex min-h-[200px] items-center justify-center rounded-lg border-2 border-dashed p-8 text-center"
              >
                <div>
                  <SettingsIcon class="text-muted-foreground mx-auto mb-4 size-12" />
                  <h3 class="text-foreground text-lg font-semibold">Advanced Settings</h3>
                  <p class="text-muted-foreground mt-2 text-sm">
                    Advanced options will be available in the next update.
                    <br />
                    This includes reset to defaults, theme export/import, and more.
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  </main>
</div>
