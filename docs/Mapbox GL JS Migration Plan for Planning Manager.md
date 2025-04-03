# **Mapbox GL JS Migration Plan for Planning Manager**

## **Overview and Replacement of Leaflet Ecosystem with Mapbox GL JS**

Migrating from Leaflet to Mapbox GL JS will involve replacing Leaflet’s map core and plugins with Mapbox GL JS equivalents and harnessing additional capabilities. Mapbox GL JS offers a modern WebGL-based rendering engine, improving performance for large datasets and enabling advanced visualizations (3D, custom styles, etc.). The first step is to remove **react-leaflet** and Leaflet-specific components and integrate **Mapbox GL JS** via a React component or wrapper. We can use Mapbox’s official GL JS library directly in a React component (with `mapbox-gl` npm package) or leverage a React integration like **react-map-gl** (Uber’s library) for convenience. Key Leaflet plugins will be replaced as follows:

* **Drawing**: Replace **react-leaflet-draw/Leaflet.draw** with **@mapbox/mapbox-gl-draw**, the official drawing plugin for Mapbox GL JS. Mapbox GL Draw provides similar draw/edit/delete controls for points, lines, and polygons​  
  [docs.mapbox.com](https://docs.mapbox.com/mapbox-gl-js/example/mapbox-gl-draw/#:~:text=map)  
  . It supports creating and editing GeoJSON features directly on the map. We will initialize a `MapboxDraw` control and add it via `map.addControl(draw)`, enabling drawing modes for markers, polylines, and polygons. As in the Mapbox example, we can listen to draw events (`draw.create`, `draw.update`, `draw.delete`) to handle completed geometries​  
  [docs.mapbox.com](https://docs.mapbox.com/mapbox-gl-js/example/mapbox-gl-draw/#:~:text=map)  
  . This covers everything we used in Leaflet.draw (like disabling polygon self-intersection, style options, etc.) by configuring MapboxDraw options (e.g., `displayControlsDefault` and specifying allowed shapes).

* **Marker Clustering**: Replace **Leaflet.markercluster** with Mapbox GL JS’s **built-in clustering** via GeoJSON sources (powered by Supercluster). In Mapbox, we enable clustering by adding a GeoJSON source with `cluster: true` and setting cluster radius/zoom thresholds​  
  [docs.mapbox.com](https://docs.mapbox.com/mapbox-gl-js/example/cluster/#:~:text=cluster%3A%20true%2C)  
  . We then add separate layers to visualize clusters (as circles or symbols) and unclustered points. For example, a circle layer with a `filter: ['has', 'point_count']` can show cluster bubbles, and a symbol layer can show the cluster point count​  
  [docs.mapbox.com](https://docs.mapbox.com/mapbox-gl-js/example/cluster/#:~:text=id%3A%20%27cluster)  
  ​  
  [docs.mapbox.com](https://docs.mapbox.com/mapbox-gl-js/example/cluster/#:~:text=layout%3A%20)  
  . Mapbox expressions allow styling clusters based on point counts (e.g., larger radius or different color for more points)​  
  [docs.mapbox.com](https://docs.mapbox.com/mapbox-gl-js/example/cluster/#:~:text=%27circle)  
  , achieving similar behavior to Leaflet.markercluster’s icon sizing. The Mapbox approach is highly performant for large datasets and avoids manual spiderfying by simply zooming in or using unclustered point layers. If “spiderfy” behavior (expanding cluster to show individual points) is needed, a community plugin like **mapboxgl-spiderifier** can be considered.

* **Heatmaps**: Replace any Leaflet heatmap plugins with Mapbox GL’s **heatmap layer** type. Mapbox GL JS supports heatmaps natively for point data – by adding a layer of type `"heatmap"` and configuring its color gradient and intensity. We can translate our Leaflet heatmap configuration (radius, blur, gradient) to Mapbox’s style properties such as `heatmap-radius`, `heatmap-intensity`, and `heatmap-color`. For example, we can use an interpolation expression for `heatmap-color` to define color stops by density​  
  [docs.mapbox.com](https://docs.mapbox.com/mapbox-gl-js/example/heatmap-layer/#:~:text=%27heatmap)  
   and adjust radius by zoom level​  
  [docs.mapbox.com](https://docs.mapbox.com/mapbox-gl-js/example/heatmap-layer/#:~:text=%2F%2F%20Adjust%20the%20heatmap%20radius,by%20zoom%20level)  
   for multi-scale visual consistency. This provides equal or better heatmap visuals than Leaflet’s plugin, with GPU acceleration for large point sets.

* **Tile Layers & Basemaps**: Leaflet’s L.tileLayer usage (for OSM, Carto, etc.) will be replaced by Mapbox GL’s style and source system. Instead of manually adding tile layers, we will use **map.setStyle(...)** with style URLs or style JSON objects that include the desired base map. For custom tile sources (e.g., ESRI or USGS raster tiles), Mapbox allows adding them as **raster sources** with URL templates. We will discuss basemap handling in detail later, but essentially all base layers will be managed through Mapbox’s style or sources (no more direct Leaflet tile layer manipulation).

* **WMS/ArcGIS Layers**: If Leaflet was using plugins like **esri-leaflet** or WMS layers for external map services, we will integrate those by either converting the data to GeoJSON or using Mapbox’s custom source support. For example, ArcGIS Feature Services can be queried for GeoJSON and added as GeoJSON sources to the map​  
  [stackoverflow.com](https://stackoverflow.com/questions/72913572/bring-arcgis-online-feature-service-layer-into-mapbox#:~:text=Bring%20ArcGIS%20Online%20feature%20service,main%20style%20is%20done%20loading)  
  . Alternatively, for ArcGIS map tiles or WMS, we can add a `raster` source with the service’s tile URL (including any required parameters for style/format). This ensures external data layers (like ArcGIS map imagery or dynamic layers) continue to function in Mapbox GL.

Overall, Mapbox GL JS and its ecosystem provide a one-to-one replacement for nearly every Leaflet plugin we use, often with improved performance or features. The plan is to incrementally swap out Leaflet components for Mapbox GL equivalents: initializing a Mapbox map, adding controls and sources for drawing, clustering, etc., and removing Leaflet initialization code. The result will preserve existing functionality with a more powerful mapping library as the foundation.

## **Drawing Tools (Geometry Creation, Editing, Deletion)**

Implementing drawing and editing of geometries in Mapbox GL JS will primarily use the **Mapbox GL Draw** plugin. After including the plugin’s JS and CSS, we instantiate it and add it to the map. We can configure which drawing tools to enable (e.g., point, line, polygon) and include a trash button for deletion​

[docs.mapbox.com](https://docs.mapbox.com/mapbox-gl-js/example/mapbox-gl-draw/#:~:text=const%20draw%20%3D%20new%20MapboxDraw%28)  
​  
[docs.mapbox.com](https://docs.mapbox.com/mapbox-gl-js/example/mapbox-gl-draw/#:~:text=map)  
. For instance, to allow drawing polygons and polylines but not circles, we’d set the appropriate options in the MapboxDraw constructor. MapboxDraw supports the same user interactions as Leaflet.draw: clicking to place vertices, double-click or click the first point to close a polygon, and dragging vertices for edits. The drawn features are stored as GeoJSON internally – we can retrieve them with `draw.getAll()` or via events.

For editing existing geometries, MapboxDraw will take an initial GeoJSON collection (we can feed in existing project geometries on load) and allow users to select and modify them (move, add vertices, etc.). The plugin generates events which we’ll use to update our application state or backend. For example, on a `draw.create` event we can immediately save the new geometry to Supabase (or store it in local state until user saves), and on `draw.update` we persist geometry changes. This ensures parity with the current Leaflet.draw-based editing workflow.

**Advanced Drawing Customizations**: If needed, Mapbox GL Draw’s behavior can be extended or customized. The library allows custom draw modes – for instance, if we wanted to support drawing circles or rectangles (Leaflet.draw had a rectangle tool), we could either approximate rectangles via the polygon tool or use a custom mode plugin. Community extensions for MapboxDraw exist (e.g., mapbox-gl-draw-rectangle) or we can write a mode that constrains polygon drawing to a rectangular shape. We should also implement the same constraints from Leaflet (like no self-intersecting polygons if that was enforced) by using the plugin’s options or by validating the output geometry (turf.js can help detect self-intersections).

To maintain user experience, we’ll replicate the Leaflet drawing toolbar’s UI/UX. MapboxDraw by default adds a set of icon buttons on the map. These might look different from Leaflet’s; we can apply CSS to style them (the plugin’s CSS is customizable) to match our app’s look (using Tailwind if needed). The tooltips and icons are accessible (SVG icons with titles). We should double-check accessibility for these controls – ensure they have `aria-label` or screen-reader text for what each button does (Draw Point, Draw Polygon, Delete, etc.), adding attributes if necessary.

Lastly, after integrating MapboxDraw, we will remove the react-leaflet-draw components and ensure any Leaflet-specific geometry handling (like converting to GeoJSON) is replaced with MapboxDraw’s GeoJSON output directly. Because our backend (PostGIS) expects GeoJSON or WKT, the switch is straightforward – MapboxDraw already provides GeoJSON features which we can send to PostGIS (or convert to WKT on the fly if needed).

## **Heatmaps and Cluster Layers**

**Heatmaps**: We will introduce a heatmap layer in Mapbox GL JS to replace Leaflet heatmap functionality. Using the project’s point data (e.g., community feedback points or incident locations), we’ll add a Mapbox layer of type `"heatmap"`. In the Mapbox style, heatmaps use data-driven styling – we can translate any weighting logic we had (for example, weighting by a “score” or using intensity based on point attributes) into the `heatmap-weight` property by providing an expression. For instance, if we have a property like `importance`, we can do `'heatmap-weight': ['interpolate', ['linear'], ['get', 'importance'], 0, 0, 5, 1]` to make higher importance points contribute more​

[docs.mapbox.com](https://docs.mapbox.com/mapbox-gl-js/example/heatmap-layer/#:~:text=%27paint%27%3A%20)  
​  
[docs.mapbox.com](https://docs.mapbox.com/mapbox-gl-js/example/heatmap-layer/#:~:text=)  
. We’ll also set up a color gradient matching our current design or improvements to it. Mapbox allows specifying multiple color stops with opacity, which we can use to mirror the Leaflet heatmap gradient or choose a more colorblind-friendly palette (considering accessibility). An example color expression might use `['heatmap-density']` to smoothly transition from blue to red as density increases​  
[docs.mapbox.com](https://docs.mapbox.com/mapbox-gl-js/example/heatmap-layer/#:~:text=%27heatmap)  
. We should also tune the `heatmap-radius` by zoom level so that at higher zooms the heat spots are more localized​  
[docs.mapbox.com](https://docs.mapbox.com/mapbox-gl-js/example/heatmap-layer/#:~:text=%2F%2F%20Adjust%20the%20heatmap%20radius,by%20zoom%20level)  
. This dynamic scaling ensures the heatmap isn’t overpowering when zoomed out versus in.

The heatmap layer in Mapbox GL will update in real-time if the underlying data source is updated. So if our application allows filtering (e.g., by project type) or time-based filtering, the heatmap will automatically re-render according to the filtered points, maintaining interactive performance.

**Cluster Layers**: For clustering, Mapbox GL’s approach is to use a single GeoJSON source with clustering enabled, and multiple layers for visualization. We will configure clustering parameters to match or improve upon Leaflet.markercluster’s behavior. For example, if our Leaflet config used a certain radius (50px default) and a disableClusteringAtZoom (like zoom 18)​

file-msaw1nvoraeh7tkr4zguqm  
​file-msaw1nvoraeh7tkr4zguqm, we set `clusterRadius: 50` and `clusterMaxZoom: 17` in the source​  
[docs.mapbox.com](https://docs.mapbox.com/mapbox-gl-js/example/cluster/#:~:text=cluster%3A%20true%2C)  
. We can also leverage **cluster properties** for more advanced clusters (Mapbox can aggregate properties like counts or attribute sums in clusters) which could be useful in future (e.g., indicating cluster composition by category).

We’ll add at least three layers: one circle layer for clustered points, one symbol layer for cluster count labels, and one circle (or symbol) layer for unclustered single points​

[docs.mapbox.com](https://docs.mapbox.com/mapbox-gl-js/example/cluster/#:~:text=id%3A%20%27clusters%27%2C)  
​  
[docs.mapbox.com](https://docs.mapbox.com/mapbox-gl-js/example/cluster/#:~:text=id%3A%20%27cluster)  
. For styling clusters, we can replicate the visual style we had (e.g., blue clusters with white text). Mapbox allows conditional styling via expressions – e.g., one approach is using a *step expression* on `point_count` to change circle size/color based on how many points in the cluster​  
[docs.mapbox.com](https://docs.mapbox.com/mapbox-gl-js/example/cluster/#:~:text=%27circle)  
​  
[docs.mapbox.com](https://docs.mapbox.com/mapbox-gl-js/example/cluster/#:~:text=)  
. This replaces the Leaflet.markercluster `iconCreateFunction` that set different classes for small/medium/large clusters. For example, we can say: clusters with \<10 points are 20px and color \#51bbd6 (blue), \<100 are 30px and color \#f1f075 (yellow), otherwise 40px and color \#f28cb1 (pink)​  
[docs.mapbox.com](https://docs.mapbox.com/mapbox-gl-js/example/cluster/#:~:text=%2F%2F%20%20%20,count%20is%20less%20than%20100)  
​  
[docs.mapbox.com](https://docs.mapbox.com/mapbox-gl-js/example/cluster/#:~:text=%27step%27%2C)  
– this mirrors the logic from our Leaflet code, which can be fine-tuned. The cluster count label layer will use the `text-field` property with `["get", "point_count_abbreviated"]` to show the number​  
[docs.mapbox.com](https://docs.mapbox.com/mapbox-gl-js/example/cluster/#:~:text=layout%3A%20)  
, and we can adjust font and size as needed.

Interactivity for clusters (zoom on click) can be implemented by listening to clicks on the cluster layer: using `map.on('click', 'clusters', e => { map.zoomTo(...); })` and `map.getSource('...').getClusterExpansionZoom(cluster_id)` to smoothly zoom in (Mapbox provides a method to get the next zoom level where a cluster breaks apart). This will replicate the click-to-zoom behavior of Leaflet clusters. If we had “spiderfy” (expanding cluster into individual points at max zoom), Mapbox GL doesn’t do that natively, but at max zoom we can simply show all points since clustering stops (or use a community plugin if absolutely needed).

By using Mapbox’s clustering, we also gain performance improvements for large datasets (since the clustering is done efficiently in web workers). We should test the clustering with our largest point datasets (like SWITRS collision points or feedback points) to ensure it behaves well. The design of cluster colors/sizes can be tweaked to improve contrast and visibility on our chosen basemaps (light vs dark mode).

## **Real-time Data Rendering and Live Updates**

The current application uses real-time layers (e.g., via Leaflet.Realtime or polling GeoJSON feeds)​

file-msaw1nvoraeh7tkr4zguqm  
​file-msaw1nvoraeh7tkr4zguqm. In Mapbox GL JS, real-time data can be handled by updating the data source at intervals or via websockets. We will create a reusable mechanism for live GeoJSON data:

* **GeoJSON Source Updates**: We will add a GeoJSON source with an initial empty dataset or initial features, and then periodically fetch new data (or updates) from the API. Using `map.getSource('id').setData(newData)` allows updating the source in place​  
  [docs.mapbox.com](https://docs.mapbox.com/mapbox-gl-js/example/live-geojson/#:~:text=%2F%2F%20Update%20the%20source%20from,the%20API%20every%202%20seconds)  
  . This will automatically refresh any layers using that source. The Mapbox GL JS official example for “live data” demonstrates this approach – e.g., using `setInterval` to fetch an API (like the ISS location) and updating the GeoJSON source​  
  [docs.mapbox.com](https://docs.mapbox.com/mapbox-gl-js/example/live-geojson/#:~:text=%2F%2F%20Update%20the%20source%20from,the%20API%20every%202%20seconds)  
  . We will implement similar logic: for each real-time feed (e.g., traffic data, or real-time vehicle positions from GTFS), use `setInterval` or web socket events to receive updates and call setData. We must ensure to handle old features: if the API gives a full GeoJSON each time, setData will replace it entirely; if it provides deltas, we can maintain the current GeoJSON and update specific features by id. Mapbox doesn’t have a built-in “realtime” plugin, but this manual update approach is straightforward and efficient (setData on a source is very fast, especially if only small changes).

* **Layer Styles for Real-time**: The layers for real-time data (e.g., a bus icon or colored line for traffic speed) can remain persistent. We might use a symbol layer for moving points (with an icon that moves as the coordinates update) or a line layer for evolving paths. If our data is time-sensitive, we can also add visual indicators (like fading old points or changing color if data is stale). For example, properties like `updated` timestamp can be used in a style expression to adjust opacity (making older data more transparent). We can incorporate logic similar to our Leaflet.realtime `updateFeature` function​  
  file-msaw1nvoraeh7tkr4zguqm  
   to add an `updated` timestamp property, and style based on it. This is an improvement made possible by Mapbox GL’s style expressions.

* **WebSockets and Event-Driven Updates**: If any data (like vehicle locations or sensor readings) come via push, we will integrate WebSocket or Supabase’s realtime if available. We can open a WebSocket connection in a React effect, and on receiving new geo-coordinates, update the map source. This avoids polling and makes updates instantaneous. Mapbox GL can handle frequent updates (even multiple per second) but we should throttle if data is extremely rapid to maintain performance.

* **Real-time Clustering/Heatmaps**: Notably, Mapbox’s clustering will also update as data changes. If we have a real-time feed of points (e.g., live traffic incidents), and we use clustering or heatmap on them, each update via setData will re-cluster on the fly. We should test that this is performing well for our use case. The clustering happens in a Web Worker, so it should be fine for moderate point counts. For very high-frequency updates, an alternative is to use a simpler visual (like just show the latest locations without clustering until user stops moving the map). We can iterate on this based on performance tests.

In summary, transitioning the real-time layers involves setting up Mapbox sources and periodically updating them. This preserves all current functionality (like tracking moving features) and could enhance it with smoother animations. We might consider using the **turf.js line interpolation** or other techniques to animate between updates (optional). However, initially, we will focus on parity: replicate the ability to show fresh data on the map at regular intervals, with popups or icons as needed (for example, binding popups on each update as we did with Leaflet Realtime’s `onEachFeature` analog in Mapbox by re-attaching event listeners to the updated layer features).

## **Timeline-Based Feature Rendering (Historical Data Playback)**

Supporting historical or time-series data in Mapbox GL JS can be achieved through **filters** and UI controls (sliders or timeline controls). The current app likely has a timeline slider for data (e.g., showing project phases or accident data over years). We will implement a timeline using one of two approaches: a custom range slider that filters map layers by date property, or a ready-made timeline control plugin.

**Property Filtering with Slider**: Mapbox GL allows filtering features in a layer by their properties using `map.setFilter()` or by defining a filter in the layer style. A common pattern (as shown in Mapbox’s “time slider” example) is to add a numeric or date property to each feature (like `year` or `timestamp`) and then update the layer’s filter as the user moves a slider​

[docs.mapbox.com](https://docs.mapbox.com/mapbox-gl-js/example/timeline-animation/#:~:text=function%20filterBy%28month%29%20)  
. For example, if we have a dataset of projects with a `year` property, we can initially set a filter `['<=', ['get', 'year'], currentYear]` to show all projects up to the selected year, or `['==', ['get','year'], selectedYear]` to show only that year. Then, the slider’s onChange event calls `map.setFilter('layer-id', filter)` to update. This is very fast since it’s GPU-side filtering. We’ll reuse this approach: convert time to an appropriate granularity (month, year, etc.) in the data and apply filters.

We will ensure the data has a suitable time attribute. If not already present, we can preprocess or augment it (as the Mapbox example did by adding a “month” property to each earthquake feature​

[docs.mapbox.com](https://docs.mapbox.com/mapbox-gl-js/example/timeline-animation/#:~:text=%2F%2F%20Create%20a%20month%20property,value%20based%20on%20time)  
). Our backend (PostGIS) can also provide data for a given time range if needed, but for smooth client-side animation, it’s best to load a chunk of data and filter on the client.

**UI Control**: For the slider itself, we can use a React component (e.g., from shadcn/ui or Headless UI slider) positioned above or below the map. We’ll sync it with the map filter. Alternatively, there is a community **mapboxgl-timeline** control​

[github.com](https://github.com/markusand/mapboxgl-timeline#:~:text=import%20TimelineControl%20from%20%27mapboxgl,timeline%2Fdist%2Fstyle.css)  
that provides a pre-built timeline UI with play/pause. This plugin can be added via `map.addControl(new TimelineControl({...}))`, where we define the start date, end date, step interval, and an onChange callback that receives the current date​  
[github.com](https://github.com/markusand/mapboxgl-timeline#:~:text=import%20TimelineControl%20from%20%27mapboxgl,timeline%2Fdist%2Fstyle.css)  
. The onChange would perform the filter update. Using this plugin could save us time and offer a nice UI out of the box (including autoplay functionality to cycle through time). We should test its compatibility and styling (it likely can be styled via CSS to match our design). If it integrates well, it’s a good addition – otherwise a custom slider might be simpler.

**Animation and Performance**: Mapbox GL can handle animating data by rapidly changing filters or data. For example, to “play” a timeline, we could either step the filter through time or actually change the data source. The filter approach is usually smoother since all data is already loaded and we’re just making some of it invisible. We should take care that the dataset for the timeline isn’t too large (if it is, consider splitting by time or loading chunks). But given the mention of “historical data playback”, presumably we manage a moderate number of features. A filter on a property (like year) is highly efficient. Mapbox’s example visualizing 2015 earthquakes with a month slider had thousands of points and performed well​

[docs.mapbox.com](https://docs.mapbox.com/mapbox-gl-js/example/timeline-animation/#:~:text=map.setFilter%28%27earthquake)  
.

We’ll also incorporate a label that displays the current time slice (e.g., the year or date range) as the slider moves​

[docs.mapbox.com](https://docs.mapbox.com/mapbox-gl-js/example/timeline-animation/#:~:text=map.setFilter%28%27earthquake)  
. This helps users know what they’re viewing. If needed, we can overlay multiple layers for different time periods (but filtering one layer dynamically is easier).

In summary, by using Mapbox GL’s filtering and either a custom or existing slider control, we will replicate the timeline feature. This approach can even be extended – for example, supporting a **date range** filter (two thumbs slider) to show a range of years, which is possible by adjusting the filter to `>= startDate AND <= endDate`. The result will be an interactive timeline that updates the map in real-time, similar to (or better than) the current Leaflet-based solution.

## **Spatial Queries and Analysis (Buffers, Intersections, Proximity)**

Spatial analysis tools in the application (like creating buffers, finding intersections, calculating distances or areas, etc.) can be achieved on the frontend using **Turf.js** and on the backend using **PostGIS**. We will use a combination of both, playing to each’s strengths:

* **Turf.js in Mapbox GL**: Turf is a JavaScript geospatial analysis library that works seamlessly with GeoJSON. It was already used in our Mapbox GL Draw example for calculating polygon area​  
  [docs.mapbox.com](https://docs.mapbox.com/mapbox-gl-js/example/mapbox-gl-draw/#:~:text=The%20example%20uses%20mapbox,its%20area%20in%20square%20meters)  
  . We will incorporate Turf for client-side analysis tasks such as: generating a buffer around a geometry, computing intersection of two polygons, or finding the nearest feature. For example, when a user draws a buffer request (perhaps selecting an object and specifying a distance), we can use `turf.buffer(feature, radius, {units: 'kilometers'})` to get a GeoJSON polygon of the buffer​  
  [turfjs.org](https://turfjs.org/docs/api/buffer#:~:text=var%20point%20%3D%20turf.point%28%5B,)  
  . This polygon can then be added to the map as a new layer (perhaps a semi-transparent highlight) to visualize it. Similarly, `turf.intersect(poly1, poly2)` can give the overlapping area of two geometries (which we could display or report in area). Using Turf on the frontend allows these tools to work offline and instantaneously for the user’s current data subset. It avoids a round-trip to the server for simple tasks, which is good for responsiveness.

We will ensure to include the relevant Turf modules (distance, buffer, booleanIntersects, etc.) to keep bundle size minimal (turf allows importing only what we need). Turf’s calculations (distance, area, etc.) are quite accurate and in the same coordinate system (WGS84) as our data, so they align with what PostGIS would compute.

For **proximity** queries (like finding nearby features within X miles), on the frontend we can use Turf’s `nearestPoint` or `pointsWithinPolygon` depending on the scenario. For instance, if a user draws a point and asks for nearby projects, we could either use a buffer \+ pointsWithin or directly PostGIS (if the dataset is large). A hybrid approach: for small sets already on the map, use Turf; for large global queries, call an API (PostGIS).

* **PostGIS via Supabase**: We will also leverage the backend for heavy-duty analysis or persistent operations. Our Supabase (PostGIS) can execute spatial SQL queries, which might be necessary if the dataset not loaded on the client or if we want to save the analysis result. For example, if we have thousands of features and the user wants to find intersections between drawn polygon and existing layers, it might be more efficient to send the drawn polygon to an API endpoint that runs `ST_Intersection` or `ST_DWithin` queries on the server (especially if not all features are rendered on the client). We’ll set up API routes (Next.js API or Supabase Edge Functions) for such cases.

However, a lot of interactive tools can be done client-side for immediacy: **distance measurement** (using Turf’s `length` for a drawn line) and **area calculation** (Turf’s `area` for a drawn polygon) are already essentially in place – for example, the Mapbox Draw example uses `turf.area()` to get polygon area and updates the UI​

[docs.mapbox.com](https://docs.mapbox.com/mapbox-gl-js/example/mapbox-gl-draw/#:~:text=const%20data%20%3D%20draw)  
​  
[docs.mapbox.com](https://docs.mapbox.com/mapbox-gl-js/example/mapbox-gl-draw/#:~:text=const%20area%20%3D%20turf)  
. We will implement similar functionality: when a user draws a shape, display its area or length in a tooltip or sidebar. This covers the measurement tool requirement with high precision (Turf’s result in square meters, etc.).

For **elevation**: Mapbox GL JS doesn’t directly give elevation data for a point (Leaflet didn’t either, unless a plugin was used). If elevation profiles are needed (perhaps the app integrated a DEM for terrain), we have a couple of options. One is to use Mapbox Terrain data – Mapbox can provide a terrain RGB tile source which can be sampled for elevation. Alternatively, use an API like Mapbox’s Elevation API or open elevation API. This is a potential enhancement: when measuring a line, also fetch elevation along it to produce a small profile chart. Implementing that might be beyond the initial migration scope but is feasible with Mapbox’s terrain support or external services. We’ll note it for future improvements.

Lastly, ensure that any spatial analysis tools have a clear UI in the new system. If Leaflet had custom controls (like a “Buffer” button), we need to recreate those either as custom HTML controls overlaying the map or as part of a sidebar tool panel. Mapbox GL JS allows custom controls (with `onAdd` methods), but often it’s simpler in React to just position a component over the map. We can use our existing UI library to create forms for buffer distance input, etc., and on submission, perform the turf calculation and add the result to the map.

In summary, we will rely on **Turf.js for on-the-fly analysis on the client**​

[docs.mapbox.com](https://docs.mapbox.com/mapbox-gl-js/example/mapbox-gl-draw/#:~:text=The%20example%20uses%20mapbox,its%20area%20in%20square%20meters)  
and **Supabase/PostGIS for heavy or persistent analysis**, ensuring all current capabilities (buffers, intersection highlighting, nearest features, etc.) are covered. This dual approach maximizes performance and accuracy while keeping the interface responsive.

## **Measurement Tools (Distance, Area, Elevation)**

For end-user measurement of distance and area on the map (distinct from programmatic calculations in the analysis section), we will implement interactive measuring tools. Leaflet likely had a plugin or custom code where the user clicks to create a path and sees the distance. In Mapbox GL JS, we have a couple of strategies:

* **Using Mapbox GL Draw**: The simplest way is to leverage the drawing plugin itself for measurements. For example, allow a “draw line” mode specifically for measuring distances. The user can draw a polyline and on each vertex or on completion, we calculate the total length using Turf’s `length()` and display it. We saw this in the Mapbox example “Measure distances” which doesn’t even use the full draw plugin, but manual click handling​  
  [docs.mapbox.com](https://docs.mapbox.com/mapbox-gl-js/example/measure/#:~:text=Click%20points%20on%20a%20map,length)  
  . We can either integrate that logic or just use Draw and compute on the `draw.create` event for lines. For area, similarly, drawing a polygon and computing area with Turf (like the example that shows area in a tooltip)​  
  [docs.mapbox.com](https://docs.mapbox.com/mapbox-gl-js/example/mapbox-gl-draw/#:~:text=const%20data%20%3D%20draw)  
  ​  
  [docs.mapbox.com](https://docs.mapbox.com/mapbox-gl-js/example/mapbox-gl-draw/#:~:text=const%20area%20%3D%20turf)  
  . Essentially, we already plan to show area for drawn polygons as part of Draw integration, so we get an area measuring tool “for free”. For lines (distance), we might want a dedicated mode.

Mapbox GL Draw doesn’t by default display the measurements, but we can easily add a callback. E.g., every time a vertex is added in draw, we could update a running distance display. Or after finishing the line, show total distance. Alternatively, we can do it outside of Draw with simpler code:

* **Custom Measure Mode**: The Mapbox “measure tool” example uses plain map click events to build a GeoJSON line as user clicks and displays distance continuously​  
  [docs.mapbox.com](https://docs.mapbox.com/mapbox-gl-js/example/measure/#:~:text=const%20value%20%3D%20document)  
  ​  
  [docs.mapbox.com](https://docs.mapbox.com/mapbox-gl-js/example/measure/#:~:text=const%20distance%20%3D%20turf)  
  . We can implement a similar custom control: when activated, clicking the map drops a point and draws a line from the last point, updating a small overlay with the cumulative distance. There is also at least one open-source plugin (**mapbox-gl-distance** or **mapbox-measure** as on GitHub) that encapsulates this behavior. For instance, the **happiness86/mapbox-measure** plugin provides a control for distance/area measurement (it likely uses Turf under the hood to compute lengths/areas). We can consider using it for quick integration, but writing our own might give more control and styling consistency.

To ensure good UX, these measure interactions should be cancelable and not conflict with draw or map navigation. A typical pattern is a toggle button: “Measure distance” which, when active, changes the cursor to crosshair and each click places a point. We’ll implement that, and possibly allow double-click to finish measuring. The result (distance) can be shown in a tooltip near the line or in a fixed container (like Leaflet’s measure tools often show a floating div). We can style this with Tailwind to match the app. Because we already have Turf, using `turf.length()` for the line geometry is straightforward, and similarly `turf.area()` if we implement an area measure mode.

**Elevation**: If the app requires measuring elevation or profiles, we need access to elevation data. Mapbox GL JS v2+ can overlay a terrain source (DEM) and you can sample it via `map.queryTerrainElevation()` at a point (in Mapbox GL JS v2+). This is an advanced feature: we could integrate Mapbox Terrain and when a user measures a line, also fetch elevation at points along that line to produce a chart. This could be done with Mapbox’s Terrain \+ a little code or an external API. However, since elevation was a “if available” note, we might plan it as a future enhancement. We will ensure the migration at least doesn’t regress anything – if currently there’s no elevation tool, we can skip for now; if there is, we’ll evaluate possibly using the Mapbox Terrain approach.

To keep things accessible, any measurement results (distance/area text) should be provided in a text element (not just drawn on the canvas) so that screen readers or copy-paste can access them. For example, we might have a live region that updates with “Current distance: X meters” as the user moves. We should also use units intelligently (if distance is over 1000m, show in km, etc.), similar to how Leaflet did or better.

By implementing these measurement tools, users will retain the ability to measure routes, areas of regions, etc., within the new Mapbox-based app, with improved visuals (e.g., more precise calculations and the option to incorporate terrain in future).

## **Mobile Optimization (Touch Support and Responsive Design)**

Mapbox GL JS is built with mobile support in mind – it handles touch gestures (pinch-zoom, pan, rotate) out of the box. We will ensure our map integration is mobile-friendly by considering layout, performance, and touch targets:

* **Responsive Layout**: The Next.js 14 App Router allows building responsive pages easily. We will make sure the map component resizes correctly on different screen sizes. The map container should be styled via CSS (Tailwind classes or responsive style) to occupy appropriate height on mobile (maybe full screen or toggling with other UI panels). We will test that the map can enter a full-screen mode on mobile without overflow issues. If we had a Leaflet “minimap” or other fixed elements, we’ll evaluate hiding or resizing them on small screens. The **ResponsiveMap** component in our docs suggests dynamic resizing logic​  
  file-msaw1nvoraeh7tkr4zguqm  
   – with Mapbox GL, the map resizes automatically when its container size changes (we may need to call `map.resize()` if the container changes display none to block). We will handle that in a useEffect on window resize or via CSS tricks.

* **Larger Touch Targets**: We need to ensure that any custom controls (draw buttons, zoom buttons, etc.) are large enough and spaced for fat fingers. Mapbox’s default zoom control and attribution control are fairly small; we might want to enlarge them on mobile or use our own controls. We can apply Tailwind classes to the controls if we create them manually (for example, if we use our own zoom in/out buttons in the UI instead of the default control, we can make them larger on mobile viewports). Likewise, the draw control buttons might need custom styling on mobile (the default are 30x30px icons, which might be okay, but we can bump to say 40px for easier tapping).

* **Gesture Handling**: On mobile, some gestures like two-finger pan to avoid interfering with page scroll are in place. Mapbox GL by default requires two-finger drag to pan the map when embedded in a scrollable page. We should keep that to prevent the map from hijacking scroll. However, if our map is full-screen, we might allow one-finger pan. Mapbox has an option `map.dragPan.disable()` on touch devices if needed and then enable with one finger. We’ll test the UX: it might be fine to leave the default (which prevents accidental map moves while scrolling the page).

* **Performance on Mobile**: WebGL can be heavy on older devices, so we should consider toggling some features for low-end devices. For instance, if we have very large GeoJSON layers, maybe we don’t load all of them on mobile or use a simpler style. One approach is to detect device performance (or expose a “reduced data mode” setting)​  
  file-msaw1nvoraeh7tkr4zguqm  
  . We can implement a setting where if enabled (or auto-detected), clustering is increased (so fewer points drawn) or some layers (like heavy heatmaps) are turned off. Mapbox GL can handle quite a lot, but it’s something to keep in mind for extreme cases.

* **Offline/Low-bandwidth considerations**: The GIS\_FEATURES mention offline capabilities with local storage​  
  file-msaw1nvoraeh7tkr4zguqm  
  . While full offline is complex with Mapbox GL (due to needing tile data), we can improve the experience by caching certain data on the device. For example, we could use the Cache API or IndexedDB to store last fetched GeoJSON so if the user revisits with no connection, we at least show something. Mapbox GL’s style and tiles could be cached via Service Worker. If offline usage is a target, we can explore using MapLibre GL which allows fully offline MBTiles usage, but that’s a bigger change. For now, we ensure that at least nothing breaks if offline (e.g., wrap map initializations in try/catch if no internet).

* **UI tweaks**: On small screens, sidebars or popups need special treatment. A common approach is to have map popups or tooltips take more of the screen or be full-width cards that slide up. We might adapt the design: for example, if a point’s popup is opened, maybe show it as a bottom sheet on mobile rather than a tiny popup over the map (for readability). These are UI improvements that can be done as part of the migration or after.

In implementing these, we’ll refer to responsive design best practices already identified in the project notes (like making controls larger for touch​

file-msaw1nvoraeh7tkr4zguqm  
and optimizing for reduced connections). The end result should be that the mapping features are just as usable on a phone or tablet as on desktop, if not more so, after leveraging Mapbox GL’s mobile-friendly capabilities.

## **Accessibility Considerations (Screen Readers and Contrast)**

Ensuring the mapping application is accessible is paramount. Web maps are inherently visual, but we can improve screen reader and keyboard support in several ways:

* **ARIA Roles and Labels**: The map container will be given an appropriate role, such as `role="region"` with `aria-label="Interactive map showing planning data"`. We might avoid `role="application"` unless we have complex interactions that justify it; a region role with a label allows screen reader users to know this is a map. We will also label controls (zoom in/out, draw buttons). Mapbox’s default controls have some built-in labels (e.g., the zoom buttons have `aria-label="Zoom in"` in recent versions, we should verify). If not, we will add those attributes by selecting the DOM elements or by using custom controls with proper `<button aria-label="Zoom in">+<button>` etc.

* **Keyboard Navigation**: By default, Mapbox GL canvas can capture keyboard events for zoom (e.g., \+/- keys). But we need to ensure focus management. When a user tabs into the map container, we might trap focus if `keyboard` support is on. We should ensure that pressing Tab when the map is focused moves out correctly. Also, any custom UI elements (like a draw toolbar) should be keyboard operable: e.g., hitting Enter on the “Draw polygon” button should activate draw mode. Mapbox GL Draw’s buttons are `<button>` elements, so they should be focusable and trigger on Enter/Space by default – we will verify this.

* **Screen Reader description of map content**: This is challenging; one approach is to provide a textual summary of the map data. For example, if a screen reader user opens the map page, we could include (perhaps visually-hidden) a list of key data points, like “10 projects displayed in the current view. Use the Projects list below for details.” The Mapbox GL Accessibility Plugin (Mapbox GL Accessibility) is an experimental plugin that attempts to create accessible markers that screen readers can navigate to announce point data​  
  [github.com](https://github.com/mapbox/mapbox-gl-accessibility#:~:text=map.on%28%27load%27%2C%20%28%29%20%3D,MapboxAccessibility)  
  ​  
  [github.com](https://github.com/mapbox/mapbox-gl-accessibility#:~:text=%2F%2F%201.%20Contain%20the%20,label%27%20%5D%20%7D%29%29%3B)  
  . Specifically, it adds hidden buttons for features (like POI labels) so that screen reader users can tab through and hear names. We can consider using this plugin or a similar strategy for our data layers. For example, for each feature shown (or maybe for each project in a sidebar), ensure it’s reachable via keyboard.

Given the complexity, at minimum we’ll ensure that all interactive controls are announced properly, and possibly provide alternative ways to get information: \- A list or table of features (projects, etc.) that are on the map, which is accessible. \- Or allow exporting data in accessible formats for analysis outside the map.

* **Color Contrast and Styles**: We will review the map color scheme for accessibility. Mapbox styles can be adjusted for higher contrast. For instance, ensure that the colors chosen for heatmaps or clusters are distinguishable by color-blind users (avoid red-green without differentiation in brightness). We might incorporate patterns or icon differences if color alone is used to encode different data types. Also, ensure that the base map labels are legible (Mapbox’s default styles typically have good contrast, but when overlaying things we have to be careful). We might add an option to switch to a high-contrast basemap if needed.

* **Focus indicators**: When any control or map marker is focused (via keyboard navigation), we should have a visible focus ring (CSS outline). We’ll avoid removing outlines in our CSS for map controls. If we implement custom focus handling (like arrow keys to move between markers), we’ll provide a clear indicator (e.g., highlight the marker or show a popup).

Because screen reader support in maps is limited, it’s also acceptable to provide an **alternative view** of the data (like a list view of projects or a table of results for a query). Our application likely already has lists of projects, etc. We will ensure those are properly linked to map interactions (for example, focusing a project in the list could highlight it on the map and vice versa).

In summary, this migration will include an accessibility audit of the mapping interface: adding ARIA labels to controls, ensuring keyboard usability, verifying color contrast, and possibly integrating Mapbox’s accessibility plugin for enhanced screen reader support (which creates hidden accessible markers for features​

[github.com](https://github.com/mapbox/mapbox-gl-accessibility#:~:text=map.on%28%27load%27%2C%20%28%29%20%3D,MapboxAccessibility)  
). This will make the new Planning Manager map not only powerful but also more inclusive to users with disabilities.

## **Basemap System: Style Switching and Basemap Management**

The current application supports multiple basemaps (OSM, Carto Positron/Dark, ESRI imagery, USGS topo, custom agency tiles) and a toggle control. With Mapbox GL JS, we will modernize this by using **style switching**. Instead of treating each basemap as a separate tile layer to overlay, we consider each as a style or a set of sources within one style.

**Using Mapbox Styles for Basemaps**: The easiest method is to prepare style definitions for each basemap option:

* For OSM/Carto Positron/Dark Matter: These are styles that can be recreated in Mapbox GL. In fact, Mapbox provides similar styles: “Mapbox Light” and “Mapbox Dark” are equivalent to Carto’s light/dark in appearance. If open-source is needed, we can find style JSONs (Carto has open styles for Positron and Dark Matter in vector tile form, or use MapLibre’s OSM Bright style). We can host these styles or reference Mapbox’s versions if acceptable. The **Mapbox GL Style Switcher** control allows easily toggling between style URLs​  
  [github.com](https://github.com/el/style-switcher#:~:text=const%20styles%3A%20MapboxStyleDefinition,v11%22)  
  . We will compile a list of style URLs for all desired basemaps. For example:

  * “Streets” (if needed) – mapbox://styles/mapbox/streets-v12

  * “Light” – mapbox://styles/mapbox/light-v11 (Carto Positron-like)​  
    [github.com](https://github.com/el/style-switcher#:~:text=const%20styles%3A%20MapboxStyleDefinition,v11%22)

  * “Dark” – mapbox://styles/mapbox/dark-v11​  
    [github.com](https://github.com/el/style-switcher#:~:text=const%20styles%3A%20MapboxStyleDefinition,v11%22)

  * “Satellite” – mapbox://styles/mapbox/satellite-v9 (pure satellite imagery)

  * “Topographic” – possibly Mapbox Outdoors style or USGS topo tiles if needed.

  * Custom agency tiles – if there is a custom tile server, we can integrate it by extending a style with a raster source.

We will implement a **Style Switcher control** (could use the community plugin​

[github.com](https://github.com/el/style-switcher#:~:text=Mapbox%20GL%20JS%20Style%20Switcher)  
or custom UI) that lists the available basemaps and changes the map’s style on selection. Using the plugin `mapbox-gl-style-switcher` is convenient: it provides a control we can feed an array of styles with title and URI​  
[github.com](https://github.com/el/style-switcher#:~:text=const%20styles%3A%20MapboxStyleDefinition,v11%22)  
and it handles the switching and UI for us. This plugin can be added via NPM and then `map.addControl(new MapboxStyleSwitcherControl({ styles: [...] }))`. Alternatively, a custom dropdown or toggle in our UI that calls `map.setStyle(newStyleURL)` is straightforward as well.

**Preserving Overlays on Style Switch**: One challenge: calling `map.setStyle()` replaces the entire style and removes custom layers added at runtime. We have many overlay layers (drawn shapes, data layers, etc.). To handle this, we can re-add those overlays after style switch. The style-switcher plugin might have an option to persist certain layers (some implementations store the layers and reapply them on style load). If not, we will implement a listener on the map’s `styledata` event: when a new style is loaded, re-add our GeoJSON sources and layers for the project data, drawings, etc. Mapbox has an example for persisting layers when switching style​

[docs.mapbox.com](https://docs.mapbox.com/mapbox-gl-js/example/style-switch/#:~:text=Persist%20sources%20and%20layers%20when,when%20changing%20a%20map%27s%20style)  
. We will follow that pattern, ensuring the user’s data and drawings don’t disappear when they toggle the basemap.

**Integration of External Basemaps**: For basemaps like ESRI World Imagery or USGS topo, which are not available as Mapbox vector style, we can incorporate them as **raster layers** in a custom style. For instance, we can create a style JSON that has one source: a raster tile source pointing to ESRI’s imagery tiles (URL template) and one layer using it. That style can then be one of the options for `setStyle`. Alternatively, we can programmatically add a raster layer on top of a blank style. But using a style JSON is cleaner. We’ll likely need to construct a style JSON for “ESRI Imagery” using Mapbox Studio or manually. Mapbox Studio can add a raster source with the tile URL like `https://services.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}` (if that’s the URL). We then style it simply as full-coverage imagery. We must also include attribution for ESRI appropriately (Mapbox style JSON has an attribution field for sources).

For the USGS topo, similarly there are tile services. We might incorporate those if needed by creating a style JSON or by adding on the fly. Considering admin management: If the admin panel allows configuring basemap URLs, we should make our system flexible. One approach is to store basemap definitions in the database (each with an `id`, `name`, `type (vector/raster)`, and either `style_url` or `tile_url`). The front-end can fetch this list and populate the style switcher. If a style\_url is provided (like “mapbox://styles/agency/xyz”), we use that. If only a tile\_url is provided (for raster), we may need to dynamically create a temporary style that includes that tile as a source (perhaps using Mapbox’s **Style Extension** capability via `map.addSource` and `map.addLayer`). Another approach: use the base style (like light) and overlay the raster as needed.

However, given typical usage, we can predefine the known base maps in code for now and update via deployment if needed. To truly allow admin management, we could fetch from Supabase on load. This is a detail of app integration more than Mapbox itself, but we’ll design the code to easily update the basemap list.

**Basemap Toggles UI**: Currently perhaps a layer control existed. We will replace that with either a dropdown of basemaps or a row of buttons (icons or text). Using shadcn/ui components, we could create a nice segmented control for “Street / Satellite / Dark” etc. This control can dispatch the style switch. We’ll ensure it’s accessible (keyboard navigable, labels).

Additionally, Mapbox GL supports **style dark/light matching** if we tie it to system theme. For example, if user has dark mode enabled, we could default to Dark Matter style. This could be an enhancement.

In summary, the basemap switching in Mapbox GL will allow us not only to replicate what we had (OSM, Carto, imagery toggles) but also to **expand** – for instance, using custom vector styles with additional data. Administrators will continue to have control by adding/removing basemap options (we’ll integrate that with our settings, possibly requiring a redeploy or an automatic style fetch if we implement dynamic loading). By using the style-switcher approach, switching will be smooth (Mapbox will smoothly fade between styles) and we maintain a single map instance throughout.

## **Managing GeoJSON Geometries with Mapbox GL JS (Frontend & Backend)**

In the current system, geometries (projects, drawn shapes, etc.) are likely stored in PostGIS and exchanged as GeoJSON (or WKT) between frontend and backend. Mapbox GL JS works natively with GeoJSON, so this pipeline aligns well:

* **Frontend Representation**: We will represent all geometries as GeoJSON features on the client side. For example, projects might be loaded from Supabase as GeoJSON. If Supabase provides WKB or WKT, we’ll convert it to GeoJSON using a library or PostGIS function (PostGIS can output GeoJSON directly via `ST_AsGeoJSON`). Assuming we have endpoints that already supply GeoJSON (perhaps the Leaflet app used the GeoJSON directly in Leaflet), we can continue that. Once we have the GeoJSON data, adding it to Mapbox is straightforward: `map.addSource('projects', { type: 'geojson', data: <geojson> })` and then corresponding layers for points/lines/polygons with styling. We can maintain a single source for all project features or multiple sources if we group by type or layer.

* **Two-way Editing**: For drawn edits (via Mapbox Draw or other tools), the result is GeoJSON. We will send that GeoJSON to Supabase (likely via an API route or directly using Supabase client libraries to call an RPC). Supabase’s PostGIS can consume GeoJSON by using functions like `ST_SetSRID(ST_GeomFromGeoJSON(...), 4326)`. If our backend expects WKT, we can easily convert GeoJSON to WKT using a library like **wellknown** (which is small and can convert GeoJSON \<-\> WKT). But it might be cleaner to adjust backend to accept GeoJSON if it doesn’t already.

* **Storing and Versioning**: Since the migration doesn’t aim to change the backend, we ensure our data flow remains consistent. Mapbox GL doesn’t impose any special format – it’s happy with FeatureCollections. We should just be careful about the coordinate reference system. Mapbox GL JS expects WGS84 (EPSG:4326) coordinates (latitude, longitude). Our PostGIS data is likely stored in 4326 as well (common for web). If not, we must transform it when providing to the client. But given Leaflet was used (which also expects 4326), it’s almost certain we are in lat/lng. So no change needed there.

* **Live Updates and Sync**: If multiple users can edit (just speculation since Supabase could allow multi-user), we might want to reflect changes in real-time on all clients. That could be done via Supabase Realtime subscriptions or polling. Regardless, updating the map is as simple as calling `setData` on the source with the new GeoJSON. We will incorporate any necessary hooks so that, for example, when a user saves an edit, we update the source locally (for snappy UI) and also wait for confirmation from backend if needed.

* **Large Data Considerations**: If some layers are very large (e.g., thousands of features), using raw GeoJSON might hit performance limits on older devices. Mapbox GL can handle quite a few points (tens of thousands) but can struggle with very complex polygons or very large numbers (100k+ points). If we encounter performance issues, one strategy is to use **vector tiles**. We could pre-generate vector tiles for static datasets (like a large set of census tracts or something) and use them as sources. However, that’s a significant undertaking (requires tile generation service or Mapbox Tilesets). Given the current app used Leaflet with presumably GeoJSON (since they mention shapefile/CSV imports, likely not using a tiling server), we can assume the scale is manageable. Still, we should test key interactions (like loading a huge shapefile) to see if additional optimization is needed. Mapbox GL’s clustering and filtering help mitigate performance issues by not rendering all points at once, which is already an improvement.

* **Supabase Integration**: We will continue to use Supabase as the single source of truth for geometries. The plan does not require any changes to the database. At most, we might create some REST endpoints that directly deliver GeoJSON (maybe using PostgREST or a Next.js API route that queries Supabase and does `ST_AsGeoJSON`). The advantage of doing `ST_AsGeoJSON` in the database is that we minimize data transformation on the client. Alternatively, Supabase JS client can retrieve the geometry as a JavaScript object if the column is of type `jsonb` containing GeoJSON, or we parse WKB into GeoJSON (using e.g. **wkx** library). We’ll pick whatever is simplest given how data is currently exposed.

In conclusion, the management of GeoJSON geometries will actually become easier with Mapbox GL JS since it natively uses GeoJSON. We’ll load data from PostGIS, feed it into map sources, allow editing (via draw or other tools) producing GeoJSON which we send back to PostGIS. No more manual conversion to Leaflet layers or back – it’s all one format end-to-end. This should reduce code complexity and potential bugs in data translation.

## **File Import/Export Support (GeoJSON, KML, CSV, Shapefiles)**

The Planning Manager supports importing and exporting various GIS file formats (GeoJSON, KML/KMZ, CSV, shapefiles). We will ensure these features continue to work by using libraries that convert these formats to GeoJSON for display on the map, and vice versa for export:

* **GeoJSON**: This is natively supported by Mapbox GL and by the browser (as just JSON). For import, if a user provides a .geojson file, we can use the File API to read it and parse JSON (as long as it’s not huge). We should validate the GeoJSON (ensure it’s valid FeatureCollection geometry). For export, since our data is already in GeoJSON in the map, we can simply offer a download of that JSON (stringify and create a blob URL). We might use a library or custom code to pretty-print or ensure the JSON meets RFC 7946\.

* **KML/KMZ**: We will use the **toGeoJSON** library (by Mapbox) which can parse KML (and GPX) into GeoJSON​  
  [blog.mapbox.com](https://blog.mapbox.com/expanding-leaflets-format-support-with-omnivore-929fc8ef6bf9#:~:text=Mapbox%20blog,KML%2C%20and%20TopoJSON)  
  . It’s battle-tested and can handle KML styles to some degree. For KMZ (which is zipped KML), we can use a combination of `toGeoJSON` and a unzip library (like **jszip**). There’s an example where you feed a KMZ (which is just a .zip file) to jszip, extract the KML, then parse it with toGeoJSON. We will implement that if KMZ is needed. After converting to GeoJSON, we add it as a source/layer in Mapbox as usual. For export to KML, there is no native browser library widely used (one could theoretically convert GeoJSON to KML by constructing XML or use something server-side). Perhaps offering KML export might require an external service or writing a small converter. If this feature is needed, we might find a JS library or do a simple implementation for points and polygons. Possibly easier: instruct the user to export to GeoJSON and use an external tool for KML if rarely needed. But since it’s listed, maybe we do implement it. A quick approach: use the geokml library or write a function that wraps each feature’s coordinates in KML tags (if time permits).

* **CSV**: Many users have data in CSV (with lat/long columns or address). We will support CSV with coordinates by using either the **csv2geojson** library (Mapbox’s library for CSV to GeoJSON)​  
  [blog.mapbox.com](https://blog.mapbox.com/expanding-leaflets-format-support-with-omnivore-929fc8ef6bf9#:~:text=Mapbox%20blog,KML%2C%20and%20TopoJSON)  
   or by manual parsing \+ mapping. Csv2geojson can auto-detect lat/long columns and produce GeoJSON points. If our use-case is mostly “CSV of points”, this is perfect. We can include csv2geojson (it’s lightweight) and do `csv2geojson.csv2geojson(csvText, { latfield: 'lat', lonfield: 'lng' }, callback)`. Alternatively, use **PapaParse** to parse CSV then iterate to build features. We should also handle CSV that might contain other geometry formats (like WKT in a column) – this is less common but if needed, we can detect a WKT column and convert via wellknown library.

For export to CSV, if the user wants coordinates in CSV, we can take our features and produce a CSV string with columns for name/attributes and lat, lon. This would especially make sense if points – exporting polygons to CSV might not be meaningful except maybe as WKT in a column. If that’s needed, we can include `wellknown` to turn GeoJSON geometry to WKT for a CSV column.

* **Shapefile**: The browser can’t directly read .shp binary without help. We will use **shp.js** (by Mike Bostock or Calvin Metcalf) which can read shapefiles (either as .shp+.dbf or as a .zip of those) into GeoJSON​  
  file-msaw1nvoraeh7tkr4zguqm  
  . This library (shp.js) is the one likely referred to in our docs. We will integrate it so that when a user uploads a .zip shapefile, we pass it to shp.js which returns GeoJSON. One consideration is that shapefile projection might not be WGS84 – shapefiles could be in local state plane, etc. Shp.js will attempt to reproject if the .prj is provided. If not, we may need to allow user to specify projection or use Proj4js. This is an edge case; ideally data is WGS84 or comes with .prj. We can incorporate **proj4js** if needed to convert common projections to WGS84 (shp.js can hook into proj4 if provided).

Exporting to shapefile in the browser is tougher – we might skip that on frontend. Alternatively, use a library like **shapefile-js** in reverse or **jsZip** to construct, but that is complex. A simpler solution is to offer shapefile export via the backend: e.g., an API endpoint that uses something like `ogr2ogr` or PostGIS `ST_AsBinary` combined with zip. Given the complexity, we might limit in-browser export to GeoJSON and KML, and possibly implement shapefile export server-side if truly needed.

* **Other Formats**: We might also consider **GPX** (for routes) – toGeoJSON covers GPX to GeoJSON conversion similarly to KML. **WKT** – not a file format per se, but maybe copy-paste of WKT. We can use wellknown.js to parse WKT to GeoJSON if needed.

**Libraries Recap**:

* @mapbox/togeojson for KML/GPX​  
  [blog.mapbox.com](https://blog.mapbox.com/expanding-leaflets-format-support-with-omnivore-929fc8ef6bf9#:~:text=Mapbox%20blog,KML%2C%20and%20TopoJSON)  
  .

* @mapbox/csv2geojson for CSV​  
  [blog.mapbox.com](https://blog.mapbox.com/expanding-leaflets-format-support-with-omnivore-929fc8ef6bf9#:~:text=Mapbox%20blog,KML%2C%20and%20TopoJSON)  
  .

* shp.js for Shapefile​  
  file-msaw1nvoraeh7tkr4zguqm  
  .

* wellknown or @turf/wkt for WKT if needed.

* jszip for zip handling (KMZ/Shapefile input). These are all open-source and fairly up-to-date. We’ll ensure to get latest versions (as of 2025\) which should handle modern JS.

We will create a modular import pipeline: e.g., an “Import Data” UI where user chooses file, we detect format by extension and then call the appropriate library, get GeoJSON, validate it, then add to map and also possibly store it (maybe user wants to save imported data as a layer in the system). For export, an “Export” button could give choices (GeoJSON, CSV, KML, etc.), and we then convert the current data accordingly.

Since the user mentioned shapefile/KML/CSV import/export explicitly, we’ll make sure all those are functional with thorough testing using sample files. This maintains the Planning Manager’s utility as a one-stop GIS tool.

## **Modular Plugin Architecture for Future Enhancements (Routing, 3D, Indoor, etc.)**

To keep the map system extensible, we will adopt a plugin-friendly architecture. This means designing our Map component and state in a way that new features can “plug in” without heavy rewrites. Several strategies:

* **Modular Map Components**: Instead of one giant Map component handling everything (draw, layers, popups, etc.), we can split functionalities into React components or hooks. For example, we might have a `<MapBoxMap>` component that initializes the base map and provides context, and then child components like `<DrawControl>`, `<LayerManager>`, `<GeocoderControl>` can subscribe to the map context and add their piece. This is akin to how react-leaflet splits components. We can create a context with the Mapbox `map` instance so that any child can get `const map = useMapboxMap()` and then do `map.addControl` or `map.addLayer`. This separation means adding a new plugin (like a routing control) is as simple as adding a new component that uses the map context.

* **Using Mapbox GL JS’s control interface**: Mapbox controls are objects with `onAdd`/`onRemove`. Many plugins (draw, style switcher, geocoder, directions) are implemented as controls. We can maintain a list of controls to add on map load. For instance, we might have a config file where we toggle “enableRouting: true” to include the Mapbox Directions control. The code would check config and do `map.addControl(new MapboxDirections({options}), 'top-left')`. This approach is straightforward for controls. For custom layers (not controls), we could have a registry or simply ensure layering happens in a defined sequence (like after style load, add our data layers).

* **Future Plugins**:

  * *Routing*: We anticipate possibly adding turn-by-turn directions or isochrones. Mapbox offers the **mapbox-gl-directions** plugin​  
    [docs.mapbox.com](https://docs.mapbox.com/mapbox-gl-js/plugins/#:~:text=Plugins%20and%20frameworks%20,calls%20are%20billable%20by%20request)  
     which adds a control for routing (it uses Mapbox Directions API under the hood, which incurs requests). It provides UI for origin/destination and draws the route line on the map. To integrate this, we’d include the plugin script and CSS, then `map.addControl(new MapboxDirections({ profile: 'driving' }))`. We would likely wrap it in a component for our React structure. Also consider alternative routing like OSRM or GraphHopper if we want offline or custom routing; but as a plugin architecture, we ensure we can drop in one or the other.

  * *3D Visualization*: Mapbox GL supports 3D via **fill-extrusion layers** for buildings or any polygon with height. As an enhancement, we could toggle a 3D buildings layer. Mapbox’s default styles often include a building layer (with `fill-extrusion` using height properties) that appears at zoom \>15​  
    [docs.mapbox.com](https://docs.mapbox.com/mapbox-gl-js/example/3d-buildings/#:~:text=Display%20buildings%20in%203D%20,is%20the%20Mapbox%20Streets)  
    . If we use Mapbox’s styles, just enabling pitch/3D view will show those. We should expose a “3D mode” button that sets `map.pitch` and perhaps `map.setTerrain`. Actually, Mapbox has also introduced global terrain with elevation data (which can make 3D terrain, not just flat). We could incorporate **3D terrain** by adding a terrain source (like Mapbox Terrain RGB tiles) and using `map.setTerrain({ source: 'mapbox-dem', exaggeration: 1.0 })` to get realistic hills. That plus enabling the globe projection can give a nice effect for large area views. These are extras we can plan for. At least, ensure our map container can handle the increased canvas size and that our layers (like draw) are not negatively affected by 3D (Mapbox Draw currently doesn’t support drawing on pitched terrain well – but for basic usage it’s fine).

  * *Indoor Mapping*: If a future requirement is indoor maps (e.g., mapping building floor plans), we might incorporate an indoor-specific plugin or strategy. Typically indoor maps involve switching to a different style or using a separate dataset. We could structure our code to load an indoor style when needed (maybe triggered by zooming into a building or selecting a facility). Mapbox has the concept of separate styles per building or using filter by level. A plugin from Mapbox or third-party might manage levels (floor switching control). We don’t implement it now, but by keeping our system modular and data-driven, it won’t be hard to add. For instance, a module that on building click loads indoor data as new layers.

  * *Geocoding & Search*: Possibly using **Mapbox Geocoder** control for address search. This is often a common addition. It’s a control that can be added to map or used standalone in UI, and calls Mapbox’s geocoding API to locate addresses or places. If the app could benefit from that (e.g., jump to an address or city), we can easily add it as a plugin.

Overall, by **designing the map initialization and augmentation logic to be declarative**, we make future enhancements easy. We can maintain a folder of “map plugins” (both third-party and custom) and an index that imports and registers them as needed. This way, features like a new data layer or analysis tool can be added by creating a new module rather than editing core map code.

We should document the process for adding new plugins to make it easier for future developers. The modular approach also aids testing – each piece can potentially be tested in isolation if we can simulate the map context.

In summary, the migration will not hard-code everything in one place but instead use an extensible pattern. As a concrete example, to add **Mapbox GL Directions** (for routing) in the future, one would import the plugin and add a `<DirectionsControl>` component that does `map.addControl(new MapboxDirections())`. Similarly, adding a **3D buildings toggle** might be a `<ThreeDToggle>` component that calls `map.setLayoutProperty('building-layer', 'visibility', 'visible')` or toggles terrain. This plugin-oriented strategy keeps the codebase clean and future-proof.

## **UI Architecture and Next.js Enhancements**

During the migration, it’s an opportunity to refine the UI architecture for better state management and performance:

* **Next.js App Router Advantages**: Next 14 App Router enables server components and improved data fetching patterns. The map, however, is a purely client-side interactive component (cannot be a server component because it relies on `window` and user interaction). We’ll designate the map component as a Client Component (`"use client"` at top) and possibly keep heavy data fetching in a parent Server Component or use React’s streaming. For example, if we have a page that shows the map and also a list of projects, we could fetch the project data on the server (via Supabase or an API) and pass it down. Then the client Map component receives the GeoJSON data as a prop to render. This prevents an extra round-trip after page load and can improve initial render speed. We need to ensure compatibility with Supabase client (could use their server-side query or direct Postgres connection if allowed).

* **State Management**: Currently uses React Context \+ SWR​  
  file-pcigkba8usuzzgmhbyn97g  
  ​file-pcigkba8usuzzgmhbyn97g. SWR is great for data fetching caching. We likely continue using SWR or the new React use() hook for data. For map-specific state (e.g., currently selected feature, current tool mode), we can still use React Context or even Zustand (a lightweight state library) for a more ergonomic approach. Zustand could hold things like map instance, or UI state like “drawModeEnabled”. However, it might be fine to keep using context to provide the map instance and some state derived from it. The key is to avoid excessive React re-renders of the map. Ideally, we treat the Mapbox map as an imperative escape hatch – we don’t re-render the whole map on each state change, we just issue commands to it (like add layer, etc.). Using context or a store to orchestrate that will help. For example, have a context that holds references to current layers and provides functions to add/remove layers, which internally call Mapbox API.

* **UI Libraries**: We are already using Tailwind and Shadcn/UI (Radix based components). These are up-to-date and we should continue using them for consistency. If anything, we might bring in additional Radix components for things like a slider (Radix Slider for the timeline), popovers (for layer menus), etc., to ensure consistent styling and accessibility. Our UI component library should suffice to build any needed map controls that are not provided by Mapbox.

* **SWR for Data**: We can use SWR to fetch geo-data (like useSWR("/api/projectsGeoJSON") to load project geometries). SWR’s caching can ensure if the user toggles between pages, the data is not refetched unnecessarily. We should configure SWR’s revalidation appropriately (maybe not auto-revalidate too often for large geo data unless needed). Possibly use SWR mutation to update cache when new features are added (so list and map stay in sync). Also consider React Query as an alternative (similar to SWR but more features), but since SWR is already in use we stick with it.

* **Performance Optimizations**: Next.js and modern React features can help performance:

  * dynamic import of Mapbox GL JS (to ensure it’s not loaded during SSR or when not needed). We will do something like `const MapGL = dynamic(() => import('./MapComponent'), { ssr: false });` for the map component, so it only renders on client. This prevents any SSR issues and splits the bundle.

  * Possibly use React’s Offscreen API (future) to keep heavy components hidden. Not needed unless we had multiple maps.

  * We will also profile the app with React DevTools to ensure state changes in other parts (like toggling a sidebar) don’t cause re-renders of the map component unexpectedly. We might isolate the map in a memoized component and only feed it minimal props (like data and config).

* **Maintaining Next Structure**: The App Router encourages colocating data fetching (loading) with the component. We might have route segments like `app/(dashboard)/projects/map/page.tsx` which fetches project data and renders Map. We should leverage that to keep code organized. We will also use Next’s built-in API routes or edge functions for anything not covered by Supabase direct (like file conversions if any were to be server-side).

* **Context for Map State**: Create contexts like MapContext (with map instance once loaded), LayerContext (if needed to manage toggling layers globally), SelectionContext (which feature is selected). This avoids prop drilling and allows independent components (like a sidebar list item) to call e.g. `setSelectedFeature(featureId)` in context which then maybe triggers map to highlight it. Using contexts or a global store ensures the map and other UI stay in sync elegantly.

* **Error Handling**: Next.js has error and loading states; we should present meaningful messages if map fails to load (e.g., Mapbox token issues) or data fails to fetch. Also use Suspense for loading states of data layers.

Given these improvements, the updated Next.js structure will be cleaner. We do not need to overhaul everything – mostly just ensure the map integration plays nicely with Next’s new features and that we aren’t stuck in old patterns (like no direct DOM manipulations outside React except the map, and no memory leaks on navigation since App Router can remount/unmount differently than pages router). We will test navigating away and back to the map to ensure we clean up the Mapbox instance properly to avoid creating multiple maps or event handlers.

## **Integration with External APIs (Census, GTFS, NOAA, SWITRS, ESRI)**

The application pulls data from various external sources. We need to preserve and possibly streamline these:

* **Census API (Demographics)**: Likely used to fetch data (e.g., population in a drawn area or tract boundaries). If currently the app fetches GeoJSON from Census (TIGER/Line shapefiles via their API or a stats API), we can continue to do that. We might add these as on-demand layers. For instance, if user requests census data for a region, we fetch the GeoJSON (or use a preset vector tile if available). The improvement with Mapbox GL is that if we get GeoJSON for census tracts, we can easily style it as a choropleth using data-driven styling (e.g., color by population attribute) and even add it as a separate source/layer. We should ensure our integration pattern (maybe using SWR or direct fetch) remains robust. For large data like nationwide census, consider using Mapbox’s vector tiles (the Census Bureau provides some via AWS or we could use mapbox-boundaries if we had a license). But in absence of that, on-demand fetching by county or state is fine.

* **GTFS (Transit data)**: GTFS comes in static files (routes, stops) and sometimes a real-time feed (GTFS-RT). If the app already handles importing GTFS, likely it parses the CSVs (or uses a library) and then creates GeoJSON for routes (as polylines) and stops (points). We will maintain that logic, but now when rendering, we can utilize custom icons or patterns for routes. One idea: if showing transit routes, Mapbox’s line layers can have different dashes or color by route type, and symbol layers for stops can use transit icons. It might be an enhancement to style GTFS data more richly thanks to Mapbox’s capabilities. But functionally, after parsing GTFS to geojson, we’ll just do map.addSource(...). If real-time vehicle positions are integrated, treat them like other real-time data (maybe via websockets from a feed, updating a source).

**NOAA Weather**: NOAA provides various data – could be weather alerts, radar tiles, hurricane tracks, etc. For weather radar or satellite, NOAA often has WMS or tiled images. With Mapbox GL, we can integrate those via `ImageSource` or `RasterSource`. For example, NOAA radar can be added as a raster layer on top of the map (similar to how one might add an image overlay in Leaflet). We might incorporate a toggle for weather layers. If previously using Leaflet with a WMS layer, now we’d do something like:

 js  
CopyEdit  
`map.addSource('radar', { type:'raster', tiles:[urlTemplate], tileSize:256 });`  
`map.addLayer({ id:'radar', type:'raster', source:'radar', paint:{ 'raster-opacity':0.8 } });`

*  Mapbox GL doesn’t support WMS directly, but we can convert a WMS request to tile URLs if the WMS supports XYZ tiling. If not, we could fetch an image for the bounding box and use ImageSource (which places a single image). For dynamic weather (like radar loops), we can periodically refresh the raster source’s tiles by invalidating cache (Mapbox doesn’t have built-in, but we can remove and re-add source every few minutes or add a cache-busting param).

   For NOAA forecast or observation points (like buoys, weather stations), those can be fetched as GeoJSON and shown with appropriate icons.

* **SWITRS (Statewide Integrated Traffic Records System)**: likely this is accident data (points on roads). Possibly the app fetches accident data by area or allows import. We can handle it similarly: treat them as a data layer with clustering or heatmap if needed to show hotspots. If integrating with an API or database dump, we fetch and then display.

* **ESRI integration**: Could be used for specific datasets or base maps. If we need to consume an ESRI Feature Service (which returns data in ArcGIS JSON), we have to convert it to GeoJSON. There is a utility `@esri/arcgis-to-geojson-utils` for that. Or the `rowanwins/mapbox-gl-arcgis-featureserver` library which can directly query ArcGIS servers and add to map​  
  [github.com](https://github.com/rowanwins/mapbox-gl-arcgis-featureserver#:~:text=rowanwins%2Fmapbox,than%20simply%20requesting%20every%20feature)  
  . We might use the latter for convenience – it can fetch features in tiles, which is efficient. But if it’s overkill, a simpler method: perform an AJAX request to the FeatureServer query endpoint with `f=geojson` (some services support GeoJSON out-of-the-box). Many ArcGIS services can return GeoJSON if requested, especially newer ones. If not, we get their JSON and convert.

We also consider if external data is heavy. For example, if connecting to an ESRI service with thousands of features, we might choose to use their tile service (if available) instead of pulling all features as GeoJSON. Mapbox can integrate ArcGIS vector tile services by adding them as a source with the URL (ArcGIS REST can sometimes provide a tileURL like `.../VectorTileServer/tile/{z}/{y}/{x}`). If our target ESRI data source has vector tiles, that’s great – we can incorporate seamlessly.

**Ensuring Future Integration**: The architecture will allow adding new external APIs similarly. For any new integration, we fetch/convert data to GeoJSON or a tile source and then add to the map. We should keep this logic modular (perhaps each external source has a service class or hook). This way, adding an integration with say EPA API (which might give pollution data) will be straightforward.

One more integration: perhaps an **ESRI Geocoder or Basemap**. If needed, we can also use ESRI’s services (like their geocoding) but since Mapbox covers that, probably not needed.

We will thoroughly test current known integrations:

* Fetch some sample Census data (like via their API or a geojson file of census tracts) and display as choropleth.

* Import a GTFS feed and ensure routes and stops appear.

* Display a NOAA weather layer (maybe temperature heatmap or radar).

* Load a SWITRS dataset (accidents as points) and use cluster or heatmap to ensure performance.

* Connect to an ArcGIS feature service (perhaps a known public one, like USGS earthquake feed or similar) to ensure our pipeline works.

The goal is that after migration, all these external data sources are still accessible and perhaps even easier to use due to Mapbox’s flexible data handling and styling.

## **Testing and Validation (Geometry Accuracy, Performance, Integration)**

After implementing the migration, comprehensive testing is necessary:

* **Unit Tests for Data Conversions**: We will write unit tests for utility functions like format conversions (e.g., ensure that when we convert KML-\>GeoJSON the properties and coordinates are correct, or when buffering a geometry with Turf the result has expected radius). We can use sample geometries and known outputs (perhaps using PostGIS as the gold standard for buffer output area or WKT matching).

* **Map Rendering Tests**: While we cannot easily auto-verify visual correctness in unit tests, we can use integration tests and manual testing. However, Mapbox GL JS has a `testMode` that can be enabled (it disables WebGL rendering and makes functions synchronous)​  
  [docs.mapbox.com](https://docs.mapbox.com/mapbox-gl-js/guides/browsers-and-testing/#:~:text=Browsers%20and%20testing%20,does%20not%20produce%20visual%20output)  
  . In testMode, we could add a source and then query features to confirm style or data. For instance, use `map.querySourceFeatures` to verify that clustering yields expected counts at a certain zoom, or that filtering hides features accordingly. This is somewhat limited but can cover logic like “after setting filter to month=5, no features of month 6 are visible (queryFeatures length check)”.

* **Integration Tests (End-to-End)**: Using a tool like **Cypress** or **Playwright**, we will script user flows: e.g., load the map page, draw a polygon, check that an area measurement appears, save it, reload page, see that polygon persists. Or: switch basemap, ensure the map style changes (maybe by checking an element’s tile URL or the presence of certain layer). We can also simulate file import via file input, and then verify that features show up (for example, import a known GeoJSON and then use `map.queryRenderedFeatures` in Cypress via the map’s canvas). Cypress can interact with DOM but not easily with the canvas content – however, we can expose some hooks for testing (like a global window.map for test environments to allow calling map functions).

* **Performance Testing**: We should test loading times with large data. Use browser devtools to measure the time it takes to add 1000 points, 10000 points, etc. Also check memory usage via performance profiles to ensure no memory leaks (especially when unmounting the map component). For example, when navigating away from the map page, the Mapbox instance should be removed (we will call `map.remove()` on unmount). We verify that a second navigation creates a new instance and doesn’t double memory. If possible, use automated tests to create and destroy the map multiple times to catch any lingering event listeners or global leaks.

* **Integration Correctness**: For external data, write automated tests that mock the external API responses. If we have a function that fetches Census data given a geography, we can mock fetch to return known GeoJSON and then ensure our layer appears or data is parsed without error. This ensures our integration code works even if external service is down or changes format.

* **Geometry accuracy**: Compare our Turf results to PostGIS for a few cases:

  * Draw a known geometry (like a square of side 1km) and buffer it by 1km. Turf result area or shape vs PostGIS ST\_Buffer – they should match reasonably (taking into account projection differences, Turf does planar in degrees by default which can be inaccurate over large areas; maybe we’ll convert to an equal-area projection for buffer calculations if needed). If differences, consider using turf’s options or backend for such heavy tasks.

  * Intersection: feed two overlapping polygons to Turf.intersect, check that the result coordinates match expected intersection region.

* **Map interactions**: Test that clicking on features shows popups (if we have popups in the plan). Ensure popups content is correct and that clicking cluster zooms correctly, etc. We can automate some of this with Playwright by simulating click at certain screen coordinates (if we know where a feature will be rendered). Alternatively, we can programmatically call the click event on map object (e.g., `map.fire('click', { lngLat: ..., point: ...})` with known coords that correspond to a feature) and see if our popup logic created a popup element.

* **Cross-browser**: Test on all supported browsers (Chrome, Firefox, Safari, Edge) on desktop and mobile. Mapbox GL should work across, but there might be small CSS issues for controls. Also test on different screen sizes for the responsive design elements (could use Cypress to set viewport and screenshot the map to ensure layout is correct).

* **Accessibility Testing**: Use tools like Axe or Lighthouse accessibility checker on the map page to catch missing labels or contrast issues. Also manually test with screen reader (NVDA/JAWS for Windows, VoiceOver for Mac) to see if our ARIA labels are announced. And test keyboard navigation: try tabbing through controls, activating them with keyboard. These can be partially automated (axe can detect missing focus indicators or roles, but actual screen reader reading needs manual verification).

* **User Acceptance Testing**: Finally, involve some end users or stakeholders to try the new system against the old requirements: e.g., ask them to perform a typical workflow (create a scenario, import some data, generate a buffer, etc.) and see if everything is intuitive and matches expectations. This will catch any subtle changes in behavior from Leaflet to Mapbox that might confuse users (for instance, maybe the way you finish drawing a polygon is slightly different – we should document or adjust to minimize confusion).

Given the critical nature of planning data, we will not skip on validating geometry integrity – ensuring that what is drawn/saved is not altered incorrectly (coordinate precision, etc.). PostGIS vs client slight differences (like number of decimal places) might exist, but we’ll maintain high precision (Mapbox GL uses double precision internally).

We will also measure integration correctness by checking logs or network calls: e.g., ensure that when toggling a real-time layer, the app is indeed calling the update interval as expected, and stopping calls when layer off.

In summary, a combination of automated tests (unit and e2e) and manual QA will be employed to validate that the migration didn’t break any functionality, that calculations (distance, area, etc.) are accurate within acceptable tolerance, and that performance is at least as good as before (likely better). We’ll add these tests to our CI pipeline to catch future regressions in the mapping features.

## **Developer Ergonomics: Testability, Maintainability, Extensibility**

Finally, we aim to make the new mapping system easy for developers to work with:

* **Encapsulated Map Logic**: By encapsulating Mapbox interactions in modular functions or hooks, we can unit test those without a real map. For example, logic for computing style expressions, or the function that creates sources/layers from our data, can be pure functions returning style JSON or layer definitions. We can test that given certain data, we output the correct layer config (like cluster color expression). This separation of logic and side-effects (Mapbox API calls) improves testability.

* **Mocking Mapbox**: For tests that do involve the map instance, we can use a Mapbox GL JS mock library​  
  [github.com](https://github.com/mapbox/mapbox-gl-js-mock#:~:text=A%20maybe,writing%20tests%20for%20Mapbox%20Studio)  
   which provides stubs for `map.addLayer`, `map.addSource`, etc. There is a community project mapbox-gl-js-mock that helps with this. This way, we can simulate a map in Jest tests and verify that our component calls (like adding 3 layers for clustering) were made correctly without launching a headless browser. Also, enabling Mapbox’s `testMode: true` in a Node canvas environment could allow image generation for visual diffs, but that’s complex; a simpler approach is ensuring no runtime errors and correct calls with mocks.

* **Documentation for Developers**: We will document the new Map architecture in the code (perhaps a README in the map module folder) detailing how things are organized, how to add a new layer or plugin, etc. This ensures maintainers can pick it up quickly. We will also note any caveats like “if adding a new basemap, also update the style switcher config in X file” etc., until such things are dynamic.

* **TypeScript Types**: We’ll leverage TypeScript for safety. Mapbox GL JS has type definitions for its API, and our data (GeoJSON) can be typed as well. We will define types for our application’s feature properties (e.g., a ProjectFeature might have certain properties) to catch errors if we mistype something. Using types with Turf (which has typings) ensures we pass correct objects. This reduces runtime bugs.

* **Linting and Formatting**: Ensure our ESLint config covers potential issues (like forgetting to cleanup an effect that sets up map event handlers, etc.). Also Prettier for consistent format. This is already likely in place.

* **Maintainability**: The combination of Next.js \+ React \+ Mapbox means developers need to know multiple domains (plus GIS). We should try to reduce complexity by keeping things as “React-y” as possible and hiding Mapbox imperative stuff behind custom hooks. E.g., a hook `useMapLayer(source, layerConfig)` that will internally call `map.addLayer` and return an identifier, and cleans up on unmount by `map.removeLayer`. Such abstractions can make code in components more declarative and easier to reason about. But we must also be cautious not to over-abstract to the point of hiding Mapbox’s power. Striking a balance is key.

* **Extensibility**: As discussed, plugin architecture and clear separation means adding new features is unlikely to break existing ones. If a developer wants to add a heatmap for a new dataset, they can follow the pattern we set with existing layers. We might even provide some utilities like a generic `addGeoJsonLayer(name, data, styleOptions)` function that handles making a source and basic layer, to avoid repetitive code. Or a small wrapper around Mapbox GL Draw to support additional shapes can be included so devs don’t have to dive into the internals each time.

* **Testing Tools**: Encourage future developers to use the tests we wrote as templates to write new ones for any new features. We’ll include in the docs how to run the map in test mode, how to use the mock libraries, etc.

* **Performance Monitoring**: Include guidelines for performance (like recommending using Web Workers for heavy computation if something new is added – e.g., if someone wants to run a complex turf analysis on thousands of features, maybe do it in a worker to not block UI; Mapbox GL itself has workers for rendering but our JS thread can still block). Possibly integrate a tool like **WebGL Insights** or just Chrome performance to watch out for frame rate drops if new animations are introduced.

* **Continuous Integration**: Set up CI to run our test suite with map in testMode (no Mapbox token needed if testMode true) to catch any failing logic. And possibly use a nightly job to hit external APIs to ensure they still respond as expected (since those integrations can change, e.g., an API endpoint URL update).

In summary, the migration will not only deliver an upgraded feature set but also a more robust and developer-friendly codebase. With thorough documentation, testing, and modular design, future developers can confidently extend the Planning Manager’s mapping capabilities (whether it’s integrating new datasets, adding analytical tools, or upgrading Mapbox versions) with minimal risk. The code scaffolding and best practices we implement now set a strong foundation for the application’s growth.

