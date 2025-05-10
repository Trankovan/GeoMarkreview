
var osmLayer = new ol.layer.Tile({
    source: new ol.source.OSM()
});

var vectorSource = new ol.source.Vector();

var vectorLayer = new ol.layer.Vector({
    source: vectorSource,
    style: function(feature) {
        var color = feature.get('color') || '#e2081a';
        var isHighlighted = feature.get('highlighted');

        var width = isHighlighted ? 4 : 2;
        var fillOpacity = isHighlighted ? '90' : '80';
        var radius = isHighlighted ? 9 : 7;

        return new ol.style.Style({
            fill: new ol.style.Fill({
                color: color.replace('#', '#' + fillOpacity)
            }),
            stroke: new ol.style.Stroke({
                color: color,
                width: width
            }),
            image: new ol.style.Circle({
                radius: radius,
                fill: new ol.style.Fill({
                    color: color
                }),
                stroke: new ol.style.Stroke({
                    color: '#ffffff',
                    width: isHighlighted ? 2 : 0
                })
            }),
            text: feature.get('showLabel') ? new ol.style.Text({
                text: feature.get('name'),
                offsetY: -15,
                fill: new ol.style.Fill({
                    color: '#000'
                }),
                stroke: new ol.style.Stroke({
                    color: '#fff',
                    width: 3
                })
            }) : null
        });
    }
});

var labelSource = new ol.source.Vector();
var labelLayer = new ol.layer.Vector({
    source: labelSource,
    style: function(feature) {
        return new ol.style.Style({
            text: new ol.style.Text({
                text: feature.get('text'),
                offsetY: feature.get('offsetY') || 0,
                offsetX: feature.get('offsetX') || 0,
                fill: new ol.style.Fill({
                    color: '#000'
                }),
                stroke: new ol.style.Stroke({
                    color: '#fff',
                    width: 3
                })
            })
        });
    }
});

var voronezh = ol.proj.transform([39.190, 51.672], 'EPSG:4326', 'EPSG:3857');

var view = new ol.View({
    center: voronezh,
    zoom: 12
});

var map = new ol.Map({
    target: 'map',
    layers: [osmLayer, vectorLayer, labelLayer],
    view: view
});

var mousePosition = new ol.control.MousePosition({
    coordinateFormat: ol.coordinate.createStringXY(4),
    projection: 'EPSG:4326',
    target: document.getElementById('myposition'),
    undefinedHTML: '&nbsp;'
});
map.addControl(mousePosition);

var draw;
var modify;
var select;
var currentFeature = null;
var isDrawing = false;
var selectedColor = '#e2081a';

var drawTypeSelect = document.getElementById('draw-type');
var drawBtn = document.getElementById('draw-btn');
var modifyBtn = document.getElementById('modify-btn');
var deleteBtn = document.getElementById('delete-btn');
var saveBtn = document.getElementById('save-btn');
var loadBtn = document.getElementById('load-btn');
var featureInfo = document.getElementById('feature-info');
var popupContainer = document.getElementById('popup-container');
var featureNameInput = document.getElementById('feature-name');
var saveFeatureBtn = document.getElementById('save-feature');
var cancelFeatureBtn = document.getElementById('cancel-feature');
var featuresList = document.getElementById('features-list');
var colorPalette = document.getElementById('color-palette');
var popupColorPalette = document.getElementById('popup-color-palette');

const API_BASE_URL = '/api/geometric-objects';

function doPan(location) {
    map.getView().animate({
        center: location,
        duration: 1000
    });
}

function addCoordinateLabels(feature) {
    var featureId = feature.get('id');
    var existingLabels = labelSource.getFeatures().filter(function(label) {
        return label.get('featureId') === featureId;
    });
    existingLabels.forEach(function(label) {
        labelSource.removeFeature(label);
    });

    var geometry = feature.getGeometry();
    var type = geometry.getType();
    var coordinates;

    if (type === 'Point') {
        coordinates = [geometry.getCoordinates()];
    } else if (type === 'LineString') {
        coordinates = geometry.getCoordinates();
    } else if (type === 'Polygon') {
        coordinates = geometry.getCoordinates()[0];
    }

    if (coordinates) {
        coordinates.forEach(function(coord, index) {
            var lonLat = ol.proj.transform(coord, 'EPSG:3857', 'EPSG:4326');
            var text = lonLat[0].toFixed(4) + ', ' + lonLat[1].toFixed(4);

            var labelFeature = new ol.Feature({
                geometry: new ol.geom.Point(coord),
                text: text,
                featureId: featureId,
                offsetY: -15,
                offsetX: 10
            });

            labelSource.addFeature(labelFeature);
        });
    }
}

function updateFeaturesList() {
    featuresList.innerHTML = '';

    var features = vectorSource.getFeatures();
    features.forEach(function(feature) {
        var featureId = feature.get('id');
        var name = feature.get('name') || 'Unnamed feature';
        var type = feature.get('type');
        var color = feature.get('color') || '#e2081a';

        var featureItem = document.createElement('div');
        featureItem.className = 'feature-item';
        featureItem.style.borderLeft = '4px solid ' + color;

        var geometry = feature.getGeometry();
        var coordInfo = '';

        if (geometry) {
            if (geometry.getType() === 'Point') {
                var coord = geometry.getCoordinates();
                var lonLat = ol.proj.transform(coord, 'EPSG:3857', 'EPSG:4326');
                coordInfo = 'Lon: ' + lonLat[0].toFixed(4) + ', Lat: ' + lonLat[1].toFixed(4);
            } else {
                var extent = geometry.getExtent();
                var center = ol.extent.getCenter(extent);
                var centerLonLat = ol.proj.transform(center, 'EPSG:3857', 'EPSG:4326');
                coordInfo = 'Center: ' + centerLonLat[0].toFixed(4) + ', ' + centerLonLat[1].toFixed(4);
            }
        }

        featureItem.innerHTML = '<strong>' + name + '</strong> (' + type + ')' +
            '<div class="feature-coordinates">' + coordInfo + '</div>';

        featureItem.addEventListener('click', function() {
            if (select) {
                select.getFeatures().clear();
                select.getFeatures().push(feature);
                currentFeature = feature;
                featureInfo.innerHTML = 'Выбран: ' + name + ' (' + type + ')';
            }

            if (geometry) {
                var extent = geometry.getExtent();
                var center = ol.extent.getCenter(extent);

                doPan(center);

                setTimeout(function() {
                    feature.set('highlighted', true);
                    vectorLayer.changed();

                    setTimeout(function() {
                        feature.set('highlighted', false);
                        vectorLayer.changed();
                    }, 2000);
                }, 500);
            }
        });

        featuresList.appendChild(featureItem);
    });
}

function addDrawInteraction() {
    map.removeInteraction(draw);
    map.removeInteraction(modify);
    map.removeInteraction(select);

    draw = new ol.interaction.Draw({
        source: vectorSource,
        type: drawTypeSelect.value
    });

    map.addInteraction(draw);

    draw.on('drawend', function(event) {
        var feature = event.feature;
        var featureId = Date.now().toString();

        feature.setProperties({
            'id': featureId,
            'name': drawTypeSelect.value + ' ' + (vectorSource.getFeatures().length + 1),
            'type': drawTypeSelect.value,
            'color': selectedColor,
            'showLabel': false
        });

        currentFeature = feature;
        featureNameInput.value = feature.get('name');

        var colorOptions = popupColorPalette.querySelectorAll('.color-option');
        colorOptions.forEach(function(option) {
            option.classList.remove('selected');
            if (option.getAttribute('data-color') === selectedColor) {
                option.classList.add('selected');
            }
        });

        var extent = feature.getGeometry().getExtent();
        var center = ol.extent.getCenter(extent);
        var pixel = map.getPixelFromCoordinate(center);

        popupContainer.style.left = pixel[0] + 'px';
        popupContainer.style.top = pixel[1] + 'px';
        popupContainer.style.display = 'block';

        addCoordinateLabels(feature);

        updateFeaturesList();
    });

    isDrawing = true;
    drawBtn.textContent = 'Stop Drawing';
}

function addModifyInteraction() {
    map.removeInteraction(draw);
    map.removeInteraction(modify);
    map.removeInteraction(select);

    select = new ol.interaction.Select();
    map.addInteraction(select);

    modify = new ol.interaction.Modify({
        features: select.getFeatures()
    });
    map.addInteraction(modify);

    select.on('select', function(event) {
        if (event.selected.length > 0) {
            var feature = event.selected[0];
            currentFeature = feature;
            var name = feature.get('name') || 'Unnamed feature';
            var type = feature.get('type') || 'Unknown';
            featureInfo.innerHTML = 'Selected: ' + name + ' (' + type + ')';
        } else {
            currentFeature = null;
            featureInfo.innerHTML = 'No feature selected';
        }
    });

    modify.on('modifyend', function(event) {
        if (currentFeature) {
            addCoordinateLabels(currentFeature);
            updateFeaturesList();
        }
    });

    isDrawing = false;
    drawBtn.textContent = 'Start Drawing';
}

function serializeFeatures() {
    var features = vectorSource.getFeatures();
    var format = new ol.format.GeoJSON();
    return format.writeFeatures(features, {
        dataProjection: 'EPSG:4326',
        featureProjection: 'EPSG:3857'
    });
}

function deserializeFeatures(geojson) {
    var format = new ol.format.GeoJSON();
    var features = format.readFeatures(geojson, {
        dataProjection: 'EPSG:4326',
        featureProjection: 'EPSG:3857'
    });
    vectorSource.clear();
    labelSource.clear();
    vectorSource.addFeatures(features);

    features.forEach(function(feature) {
        addCoordinateLabels(feature);
    });

    updateFeaturesList();
}

function selectColor(color, palette) {
    var colorOptions = palette.querySelectorAll('.color-option');
    colorOptions.forEach(function(option) {
        option.classList.remove('selected');
        if (option.getAttribute('data-color') === color) {
            option.classList.add('selected');
        }
    });

    selectedColor = color;

    if (currentFeature && !isDrawing) {
        currentFeature.set('color', color);
        vectorLayer.changed();
        updateFeaturesList();
    }
}

colorPalette.addEventListener('click', function(e) {
    if (e.target.classList.contains('color-option')) {
        var color = e.target.getAttribute('data-color');
        selectColor(color, colorPalette);
    }
});

popupColorPalette.addEventListener('click', function(e) {
    if (e.target.classList.contains('color-option')) {
        var color = e.target.getAttribute('data-color');
        selectColor(color, popupColorPalette);

        selectColor(color, colorPalette);
    }
});

drawBtn.addEventListener('click', function() {
    if (isDrawing) {
        map.removeInteraction(draw);
        isDrawing = false;
        drawBtn.textContent = 'Start Drawing';
    } else {
        addDrawInteraction();
    }
});

modifyBtn.addEventListener('click', function() {
    addModifyInteraction();
});

deleteBtn.addEventListener('click', function() {
    if (currentFeature) {
        var featureId = currentFeature.get('id');
        var labelsToRemove = labelSource.getFeatures().filter(function(label) {
            return label.get('featureId') === featureId;
        });
        labelsToRemove.forEach(function(label) {
            labelSource.removeFeature(label);
        });

        vectorSource.removeFeature(currentFeature);
        currentFeature = null;
        featureInfo.innerHTML = 'Объект удален';

        updateFeaturesList();
    } else {
        featureInfo.innerHTML = 'Объект не выбран';
    }
});

async function loadFeaturesFromBackend() {
    try {
        const response = await fetch(API_BASE_URL);
        const features = await response.json();
        console.log('Loaded features:', features);

        vectorSource.clear();

        features.forEach(feature => {
            console.log('Подтягиваем объекты:', feature);
            console.log('Координаты:', feature.coordinates);

            const geoJsonFeature = {
                type: 'Feature',
                geometry: {
                    type: feature.type,
                    coordinates: feature.coordinates
                },
                properties: feature.properties
            };

            console.log('Созданный GeoJSON объект:', geoJsonFeature);
            console.log('Координаты:', geoJsonFeature.geometry.coordinates);

            try {
                const geometry = new ol.format.GeoJSON().readGeometry(geoJsonFeature.geometry);
                const olFeature = new ol.Feature({
                    geometry: geometry.transform('EPSG:4326', 'EPSG:3857'),
                    name: feature.name,
                    type: feature.type,
                    color: feature.properties.color,
                    showLabel: feature.properties.showLabel,
                    id: feature.id
                });
                vectorSource.addFeature(olFeature);
            } catch (geometryError) {
                console.error('Проблема с обработкой :', geometryError);
                console.error('PПроблемный объект:', feature);
                console.error('Проблемный GeoJSON:', geoJsonFeature);
            }
        });

        updateFeaturesList();
    } catch (error) {
        console.error('Ошибка объектов:', error);
        console.error('Детали:', error.stack);
        alert('Ошибка при загрузке объектов. Пожалуйста попробуйте позже.');
    }
}

async function saveFeaturesToBackend() {
    const features = vectorSource.getFeatures();
    const featureCollection = {
        type: 'FeatureCollection',
        features: features.map(feature => {
            const geometry = feature.getGeometry().transform('EPSG:3857', 'EPSG:4326');
            console.log('Сохранение:', geometry);
            return {
                type: 'Feature',
                geometry: geometry,
                properties: {
                    id: feature.get('id'),
                    name: feature.get('name'),
                    type: feature.get('type'),
                    color: feature.get('color'),
                    showLabel: feature.get('showLabel')
                }
            };
        })
    };

    try {
        const existingFeatures = await fetch(API_BASE_URL).then(res => res.json());
        for (const feature of existingFeatures) {
            await fetch(`${API_BASE_URL}/${feature.id}`, { method: 'DELETE' });
        }

        for (const feature of featureCollection.features) {
            const geometricObject = {
                name: feature.properties.name,
                type: feature.properties.type,
                coordinates: feature.geometry.getCoordinates(),
                properties: feature.properties
            };

            console.log('Сохранение объекта:', geometricObject);

            await fetch(API_BASE_URL, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(geometricObject)
            });
        }

        alert('Объект успешно сохранен!');
    } catch (error) {
        console.error('Ошибка при сохранении', error);
        console.error('Информация:', error.stack);
        alert('Ошибка при сохранении.');
    }
}

document.getElementById('save-btn').addEventListener('click', saveFeaturesToBackend);
document.getElementById('load-btn').addEventListener('click', loadFeaturesFromBackend);

saveFeatureBtn.addEventListener('click', function() {
    if (currentFeature) {
        currentFeature.set('name', featureNameInput.value);
        currentFeature.set('color', selectedColor);

        currentFeature.set('showLabel', true);

        popupContainer.style.display = 'none';
        featureInfo.innerHTML = 'Объект сохранен: ' + featureNameInput.value;

        addCoordinateLabels(currentFeature);

        updateFeaturesList();

        vectorLayer.changed();
    }
});

cancelFeatureBtn.addEventListener('click', function() {
    popupContainer.style.display = 'none';
});

addModifyInteraction();
updateFeaturesList();
loadFeaturesFromBackend();