<script lang="ts">
	import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '$lib/components/ui/card/index.js';
	import { Label } from '$lib/components/ui/label/index.js';
	import { appearance } from '$lib/stores/appearance.store.js';
	import { cn } from '$lib/utils.js';
	import MinusIcon from '@lucide/svelte/icons/minus';
	import { PanelLeft } from '@lucide/svelte';
	import PlusIcon from '@lucide/svelte/icons/plus';

	// Sidebar width constraints (in pixels)
	const MIN_WIDTH = 200;
	const MAX_WIDTH = 400;
	const STEP = 10;

	// Common preset widths
	const WIDTH_PRESETS = [240, 280, 320];

	/**
	 * Component props
	 */
	interface Props {
		/** Additional CSS classes for the container */
		class?: string;
		/** Whether to show the visual preview */
		showPreview?: boolean;
	}

	let {
		class: className,
		showPreview = true
	}: Props = $props();

	// Local state for immediate feedback before store update
	let localValue = $state<number>(parseInt(appearance.currentSettings.sidebarWidth) || 280);
	let isDragging = $state(false);

	// Sync local state with store
	$effect(() => {
		if (!isDragging) {
			localValue = parseInt(appearance.currentSettings.sidebarWidth) || 280;
		}
	});

	/**
	 * Handle slider input change
	 */
	function handleInput(event: Event) {
		const target = event.target as HTMLInputElement;
		const value = parseInt(target.value);
		localValue = value;
	}

	/**
	 * Handle slider change (on release)
	 */
	function handleChange(event: Event) {
		const target = event.target as HTMLInputElement;
		const value = parseInt(target.value);
		localValue = value;
		isDragging = false;

		// Update the store
		appearance.updateSetting('sidebarWidth', value.toString());
	}

	/**
	 * Handle slider drag start
	 */
	function handleDragStart() {
		isDragging = true;
	}

	/**
	 * Decrease sidebar width by step
	 */
	function decreaseWidth() {
		const newValue = Math.max(MIN_WIDTH, localValue - STEP);
		localValue = newValue;
		appearance.updateSetting('sidebarWidth', newValue.toString());
	}

	/**
	 * Increase sidebar width by step
	 */
	function increaseWidth() {
		const newValue = Math.min(MAX_WIDTH, localValue + STEP);
		localValue = newValue;
		appearance.updateSetting('sidebarWidth', newValue.toString());
	}

	/**
	 * Set sidebar width to preset value
	 */
	function setPresetWidth(width: number) {
		localValue = width;
		appearance.updateSetting('sidebarWidth', width.toString());
	}

	/**
	 * Calculate percentage for slider position
	 */
	const sliderPercentage = $derived(
		((localValue - MIN_WIDTH) / (MAX_WIDTH - MIN_WIDTH)) * 100
	);

	/**
	 * Convert pixels to rems (assuming 1rem = 16px base)
	 */
	const widthInRems = $derived((localValue / 16).toFixed(1));

	/**
	 * Get display label for width
	 */
	const widthLabel = $derived(`${localValue}px (${widthInRems}rem)`);

	/**
	 * Calculate preview width as percentage of max width
	 */
	const previewWidth = $derived(`${(localValue / MAX_WIDTH) * 100}%`);
</script>

<Card class={cn('overflow-hidden', className)}>
	<CardHeader class="space-y-1 pb-4">
		<div class="flex items-center gap-2">
			<PanelLeft class="text-muted-foreground size-5" />
			<CardTitle class="text-lg">Sidebar Width</CardTitle>
		</div>
		<CardDescription>
			Adjust the width of the secondary sidebar to fit your preferences
		</CardDescription>
	</CardHeader>

	<CardContent class="space-y-6">
		<!-- Sidebar Width Slider Control -->
		<div class="space-y-3">
			<div class="flex items-center justify-between">
				<Label for="sidebar-width-slider" class="text-sm font-medium">
					Width: <span class="text-primary font-semibold">{widthLabel}</span>
				</Label>

				<!-- Quick adjust buttons -->
				<div class="flex items-center gap-1">
					<button
						onclick={decreaseWidth}
						disabled={localValue === MIN_WIDTH}
						class="border-input hover:bg-accent hover:text-accent-foreground disabled:border-border/40 disabled:bg-transparent disabled:text-muted-foreground/40 disabled:cursor-not-allowed inline-flex h-7 w-7 items-center justify-center rounded-md border text-sm transition-colors"
						type="button"
						aria-label="Decrease sidebar width"
					>
						<MinusIcon class="size-3" />
					</button>
					<button
						onclick={increaseWidth}
						disabled={localValue === MAX_WIDTH}
						class="border-input hover:bg-accent hover:text-accent-foreground disabled:border-border/40 disabled:bg-transparent disabled:text-muted-foreground/40 disabled:cursor-not-allowed inline-flex h-7 w-7 items-center justify-center rounded-md border text-sm transition-colors"
						type="button"
						aria-label="Increase sidebar width"
					>
						<PlusIcon class="size-3" />
					</button>
				</div>
			</div>

			<!-- Custom Slider -->
			<div class="relative flex items-center gap-3">
				<span class="text-muted-foreground text-xs font-medium">{MIN_WIDTH}px</span>

				<div class="relative flex-1">
					<input
						id="sidebar-width-slider"
						type="range"
						min={MIN_WIDTH}
						max={MAX_WIDTH}
						step={STEP}
						value={localValue}
						oninput={handleInput}
						onchange={handleChange}
						onmousedown={handleDragStart}
						ontouchstart={handleDragStart}
						class="pointer-events-none absolute inset-0 z-10 h-full w-full cursor-pointer opacity-0"
						aria-label="Sidebar width slider"
					/>
					<div
						class="bg-muted relative h-2 w-full rounded-full overflow-hidden"
						role="presentation"
					>
						<div
							class="bg-primary h-full transition-all duration-75 ease-out"
							style="width: {sliderPercentage}%"
						></div>
					</div>
					<div
						class="bg-background border-2 border-primary ring-offset-background absolute top-1/2 size-5 -translate-y-1/2 rounded-full shadow-sm transition-all duration-75 ease-out"
						style="left: calc({sliderPercentage}% - 10px)"
						role="presentation"
					></div>
				</div>

				<span class="text-muted-foreground text-xs font-medium">{MAX_WIDTH}px</span>
			</div>

			<!-- Width presets -->
			<div class="flex gap-2">
				{#each WIDTH_PRESETS as preset}
					<button
						onclick={() => setPresetWidth(preset)}
						class="border-input hover:border-primary hover:bg-accent hover:text-accent-foreground data-[active=true]:border-primary data-[active=true]:bg-primary/10 data-[active=true]:text-primary inline-flex h-8 flex-1 items-center justify-center rounded-md border px-3 text-sm font-medium transition-colors"
						data-active={localValue === preset}
						aria-pressed={localValue === preset}
						type="button"
					>
						{preset}px
					</button>
				{/each}
			</div>
		</div>

		{#if showPreview}
			<!-- Visual Preview -->
			<div class="border-border bg-muted/30 rounded-lg border p-4">
				<p class="text-muted-foreground mb-3 text-xs font-medium uppercase">
					Preview
				</p>
				<div class="relative mx-auto h-24 w-full rounded-md border-2 border-dashed border-border">
					<!-- Sidebar preview -->
					<div
						class="bg-primary/20 absolute left-0 top-0 flex h-full items-center justify-center rounded-l-md border-r border-border transition-all duration-200"
						style="width: {previewWidth};"
					>
						<span class="text-primary text-xs font-semibold">
							{localValue}px
						</span>
					</div>
					<!-- Main content area label -->
					<div
						class="absolute right-0 top-0 flex h-full items-center justify-center rounded-r-md"
						style="width: calc(100% - {previewWidth});"
					>
						<span class="text-muted-foreground text-xs">Content</span>
					</div>
				</div>
				<p class="text-muted-foreground mt-2 text-center text-xs">
					This shows the relative width of the sidebar compared to the main content area
				</p>
			</div>
		{/if}
	</CardContent>
</Card>
