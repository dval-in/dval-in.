<script lang="ts">
	import Text from '$lib/components/typography/Text.svelte';
	import {
		Body as TableBody,
		Cell as TableCell,
		Head as TableHead,
		Header as TableHeader,
		Root as TableRoot,
		Row as TableRow
	} from '$lib/components/ui/table';
	import {
		Content as PaginationContent,
		Ellipsis as PaginationEllipsis,
		Item as PaginationItem,
		Link as PaginationLink,
		NextButton as PaginationNextButton,
		PrevButton as PaginationPrevButton,
		Root as PaginationRoot
	} from '$lib/components/ui/pagination';
	import { type Readable } from 'svelte/store';
	import { createRender, createTable, Render, Subscribe } from 'svelte-headless-table';
	import {
		mdiAccount,
		mdiArrowDown,
		mdiArrowUp,
		mdiChevronLeft,
		mdiChevronRight,
		mdiCloseCircle,
		mdiSwordCross
	} from '@mdi/js';
	import Icon from '$lib/components/ui/icon/icon.svelte';
	import {
		addColumnFilters,
		addPagination,
		addResizedColumns,
		addSortBy
	} from 'svelte-headless-table/plugins';
	import { Button } from '$lib/components/ui/button';
	import SelectFilter from './SelectFilter.svelte';
	import type { IWish } from '$lib/types/wish';
	import DateRangeFilter from '$lib/components/tables/banner-history-table/DateRangeFilter.svelte';
	import NameCell from '$lib/components/tables/banner-history-table/NameCell.svelte';
	import DateCell from '$lib/components/tables/banner-history-table/DateCell.svelte';
	import i18n from '$lib/services/i18n';
	import { Alert, AlertDescription, AlertTitle } from '$lib/components/ui/alert';

	const PAGE_SIZE = 25;

	export let data: Readable<IWish[]>;

	const table = createTable(data, {
		page: addPagination({ initialPageSize: PAGE_SIZE }),
		filter: addColumnFilters(),
		sort: addSortBy({
			initialSortKeys: [{ id: 'order', order: 'desc' }],
			toggleOrder: ['desc', 'asc']
		}),
		resize: addResizedColumns()
	});

	const dateRangeFilter = ({
		filterValue,
		value
	}: {
		filterValue: (number | null)[];
		value: string;
	}) => {
		const [min, max] = filterValue;
		const unixTime = new Date(value).getTime();
		if (min === null || max === null) return true;

		return min <= unixTime && unixTime <= max;
	};

	const includeFilter = ({ filterValue, value }: { filterValue: string[]; value: string }) => {
		if (filterValue.length === 0) return true;
		return filterValue.includes(value);
	};

	const columns = table.createColumns([
		table.column({
			accessor: 'order',
			header: 'Order',
			plugins: {
				resize: {
					initialWidth: 80
				}
			}
		}),
		table.column({
			accessor: 'date',
			header: $i18n.t('table.banner_history.date'),
			cell: ({ value }) => {
				return createRender(DateCell, { value: value.toString() });
			},
			plugins: {
				sort: {
					disable: true
				},
				filter: {
					fn: dateRangeFilter,
					initialFilterValue: [null, null],
					render: ({ filterValue, preFilteredValues }) =>
						createRender(DateRangeFilter, { filterValue, preFilteredValues })
				},
				resize: {
					initialWidth: 100
				}
			}
		}),
		table.column({
			accessor: 'type',
			header: $i18n.t('table.banner_history.type'),
			cell: ({ value }) => {
				return createRender(Icon, {
					path: value === 'Character' ? mdiAccount : mdiSwordCross
				});
			},
			plugins: {
				sort: {
					disable: true
				},
				filter: {
					fn: includeFilter,
					initialFilterValue: [],
					render: ({ filterValue, preFilteredValues }) =>
						createRender(SelectFilter, {
							filterValue,
							title: $i18n.t('table.banner_history.type'),
							preFilteredValues
						})
				},
				resize: {
					initialWidth: 88
				}
			}
		}),
		table.column({
			accessor: 'key',
			header: $i18n.t('table.banner_history.name'),
			cell: ({ value }) => {
				return createRender(NameCell, {
					key: value
				});
			}
		}),
		table.column({
			accessor: 'rarity',
			header: $i18n.t('table.banner_history.rarity'),
			plugins: {
				sort: {
					disable: true
				},
				filter: {
					fn: includeFilter,
					initialFilterValue: [],
					render: ({ filterValue, preFilteredValues }) =>
						createRender(SelectFilter, {
							filterValue,
							title: $i18n.t('table.banner_history.rarity'),
							preFilteredValues
						})
				},
				resize: {
					initialWidth: 96
				}
			}
		}),
		table.column({
			accessor: 'pity',
			header: $i18n.t('table.banner_history.pity'),
			plugins: {
				resize: {
					initialWidth: 84
				}
			}
		})
	]);

	const { headerRows, pageRows, tableAttrs, tableBodyAttrs, pluginStates, rows } =
		table.createViewModel(columns);

	const { pageIndex } = pluginStates.page;
	const { sortKeys } = pluginStates.sort;
	$: $sortKeys;
</script>

<div class="flex flex-1 flex-col justify-between gap-2 overflow-x-auto">
	<TableRoot {...$tableAttrs}>
		<TableHeader>
			{#each $headerRows as headerRow (headerRow.id)}
				<Subscribe rowAttrs={headerRow.attrs()} let:rowAttrs>
					<TableRow {...rowAttrs}>
						{#each headerRow.cells as cell (cell.id)}
							<Subscribe
								attrs={cell.attrs()}
								let:attrs
								props={cell.props()}
								let:props
							>
								<TableHead
									{...attrs}
									class={`px-0 ${cell.id === 'key' ? 'text-start' : 'text-center'}`}
								>
									{#if !props.sort.disabled}
										<Button variant="ghost" on:click={props.sort.toggle}>
											<Render of={cell.render()} />
											{#if props.sort.order === 'asc'}
												<Icon path={mdiArrowDown} />
											{:else if props.sort.order === 'desc'}
												<Icon path={mdiArrowUp} />
											{/if}
										</Button>
									{:else if props.filter?.render}
										<Render of={props.filter.render} />
									{:else}
										<Render of={cell.render()} />
									{/if}
								</TableHead>
							</Subscribe>
						{/each}
					</TableRow>
				</Subscribe>
			{/each}
		</TableHeader>
		<TableBody {...$tableBodyAttrs}>
			{#if $pageRows.length > 0}
				{#each $pageRows as row (row.id)}
					<Subscribe rowAttrs={row.attrs()} let:rowAttrs>
						<TableRow
							{...rowAttrs}
							class={`hover:bg-tertiaryHover ${row.cellForId.rarity.value === 5 ? 'bg-fivestar/50' : 0} ${row.cellForId.rarity.value === 4 ? 'bg-fourstar' : 0}`}
						>
							{#each row.cells as cell (cell.id)}
								<Subscribe attrs={cell.attrs()} let:attrs>
									<TableCell
										{...attrs}
										class={`p-2  ${cell.id === 'key' ? 'text-start' : 'text-center'} `}
									>
										{#if cell.id === 'number'}
											{$data.length - parseInt(cell.row.id)}
										{:else}
											<Render of={cell.render()} />
										{/if}
									</TableCell>
								</Subscribe>
							{/each}
						</TableRow>
					</Subscribe>
				{/each}
			{:else}
				<TableRow>
					<Alert class="gap-6">
						<Icon path={mdiCloseCircle} />
						<AlertTitle>No wishes for selection</AlertTitle>
						<AlertDescription>No wishes for selection</AlertDescription>
					</Alert>
				</TableRow>
			{/if}
		</TableBody>
	</TableRoot>
	<PaginationRoot
		count={$rows.length}
		let:currentPage
		let:pages
		perPage={PAGE_SIZE}
		siblingCount={0}
	>
		<PaginationContent>
			<PaginationItem>
				<PaginationPrevButton on:click={() => ($pageIndex = $pageIndex - 1)}>
					<Icon path={mdiChevronLeft} />
					<Text type="p" class="max-sm:hidden">{$i18n.t('action.previous')}</Text>
				</PaginationPrevButton>
			</PaginationItem>
			{#each pages as page (page.key)}
				{#if page.type === 'ellipsis'}
					<PaginationItem>
						<PaginationEllipsis />
					</PaginationItem>
				{:else}
					<PaginationItem>
						<PaginationLink
							{page}
							isActive={currentPage === page.value}
							on:click={() => ($pageIndex = page.value - 1)}
						>
							<Text type="p">{page.value}</Text>
						</PaginationLink>
					</PaginationItem>
				{/if}
			{/each}
			<PaginationItem>
				<PaginationNextButton on:click={() => ($pageIndex = $pageIndex + 1)}>
					<Text type="p" class="max-sm:hidden">{$i18n.t('action.next')}</Text>
					<Icon path={mdiChevronRight} />
				</PaginationNextButton>
			</PaginationItem>
		</PaginationContent>
	</PaginationRoot>
</div>
