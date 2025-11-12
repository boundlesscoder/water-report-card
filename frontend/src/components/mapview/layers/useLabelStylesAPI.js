// "use client";

// import { BACKEND_URL } from '../../../lib/api-config';

// // Utility to apply saved label styles from admin panel to map layers
// export async function loadAndApplyLabelStyles(map) {
//   try {
//     const response = await fetch(`${BACKEND_URL}/api/layer-styles/label-styles`);
//     if (!response.ok) {
//       console.warn('Label styles API not available, using default styles');
//       return;
//     }

//     const data = await response.json();
//     if (!data.styles) {
//       console.warn('No saved label styles found, using defaults');
//       return;
//     }

//     const styles = data.styles;
    
//     // Apply styles to place labels
//     applyPlaceLabelStyles(map, styles);
    
//     // Apply styles to road labels  
//     // applyRoadLabelStyles(map, styles);
    
//   } catch (error) {
//     console.error('Error loading label styles:', error);
//   }
// }

// function applyPlaceLabelStyles(map, styles) {
//   const placeLayers = [
//     'place-country-label',
//     'place-state-label', 
//     'place-capital-label',
//     'place-city-major-label',
//     'place-city-medium-label',
//     'place-city-small-label',
//     'place-village-label'
//   ];

//   placeLayers.forEach(layerId => {
//     if (!map.getLayer(layerId) || !styles[layerId]) return;

//     const style = styles[layerId];
    
//     try {
//       // Update paint properties
//       if (style.textColor) {
//         map.setPaintProperty(layerId, 'text-color', style.textColor);
//       }
      
//       if (style.textHaloColor) {
//         map.setPaintProperty(layerId, 'text-halo-color', style.textHaloColor);
//       }
      
//       if (style.textHaloWidth !== undefined) {
//         map.setPaintProperty(layerId, 'text-halo-width', parseFloat(style.textHaloWidth));
//       }
      
//       if (style.textOpacity !== undefined) {
//         map.setPaintProperty(layerId, 'text-opacity', parseFloat(style.textOpacity));
//       }

//       // Update layout properties
//       if (style.textFont) {
//         const fontArray = style.textFont.includes('Bold') 
//           ? [style.textFont, 'Arial Unicode MS Bold']
//           : style.textFont.includes('Medium')
//           ? [style.textFont, 'Arial Unicode MS Regular'] 
//           : [style.textFont, 'Arial Unicode MS Regular'];
        
//         map.setLayoutProperty(layerId, 'text-font', fontArray);
//       }

//       // Update text size based on zoom and symbolrank
//       if (style.textSize) {
//         const textSizeExpression = createTextSizeExpression(style.textSize, layerId);
//         map.setLayoutProperty(layerId, 'text-size', textSizeExpression);
//       }

//       // Update zoom range
//       if (style.minZoom !== undefined) {
//         map.setLayerZoomRange(layerId, parseInt(style.minZoom), parseInt(style.maxZoom) || 22);
//       }

//     } catch (error) {
//       console.error(`Error applying styles to ${layerId}:`, error);
//     }
//   });
// }

// function applyRoadLabelStyles(map, styles) {
//   const roadLayers = [
//     'road-label-motorway',
//     'road-label-trunk', 
//     'road-label-primary',
//     'road-label-secondary',
//     'road-label-tertiary',
//     'road-label-street',
//     'road-label-service',
//     'road-label-path',
//     'road-label-track'
//   ];

//   roadLayers.forEach(layerId => {
//     if (!map.getLayer(layerId) || !styles[layerId]) return;

//     const style = styles[layerId];
    
//     try {
//       // Update paint properties
//       if (style.textColor) {
//         map.setPaintProperty(layerId, 'text-color', style.textColor);
//       }
      
//       if (style.textHaloColor) {
//         map.setPaintProperty(layerId, 'text-halo-color', style.textHaloColor);
//       }
      
//       if (style.textHaloWidth !== undefined) {
//         map.setPaintProperty(layerId, 'text-halo-width', parseFloat(style.textHaloWidth));
//       }
      
//       if (style.textOpacity !== undefined) {
//         map.setPaintProperty(layerId, 'text-opacity', parseFloat(style.textOpacity));
//       }

//       // Update layout properties
//       if (style.textFont) {
//         const fontArray = style.textFont.includes('Bold') 
//           ? [style.textFont, 'Arial Unicode MS Bold']
//           : style.textFont.includes('Medium')
//           ? [style.textFont, 'Arial Unicode MS Regular'] 
//           : [style.textFont, 'Arial Unicode MS Regular'];
        
//         map.setLayoutProperty(layerId, 'text-font', fontArray);
//       }

//       // Update text size
//       if (style.textSize) {
//         const textSizeExpression = createRoadTextSizeExpression(style.textSize);
//         map.setLayoutProperty(layerId, 'text-size', textSizeExpression);
//       }

//       // Update zoom range
//       // if (style.minZoom !== undefined) {
//       //   map.setLayerZoomRange(layerId, parseInt(style.minZoom), parseInt(style.maxZoom) || 22);
//       // }

//     } catch (error) {
//       console.error(`Error applying styles to ${layerId}:`, error);
//     }
//   });
// }

// function createTextSizeExpression(textSize, layerId) {
//   const min = parseFloat(textSize.min);
//   const max = parseFloat(textSize.max);
  
//   return [
//     "interpolate", ["linear"], ["zoom"],
//     5, min,
//     10, (min + max) / 2,
//     16, max
//   ];
// }

// function createRoadTextSizeExpression(textSize) {
//   const min = parseFloat(textSize.min);
//   const max = parseFloat(textSize.max);
  
//   return [
//     "interpolate", ["linear"], ["zoom"],
//     6, min,
//     12, (min + max) / 2,
//     18, max
//   ];
// }

// // Function to be called when styles are updated in admin panel
// export function applyLabelStylesUpdate(map, styles) {
//   applyPlaceLabelStyles(map, styles);
//   // applyRoadLabelStyles(map, styles);
// }