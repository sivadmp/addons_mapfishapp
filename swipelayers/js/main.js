Ext.namespace("GEOR.Addons");

GEOR.Addons.SwipeLayers = function(map, options) {
    this.map = map;
    this.options = options;
    this.control = null;
    this.item = null;
};

// If required, may extend or compose with Ext.util.Observable
GEOR.Addons.SwipeLayers.prototype = {
    mmap: null,
    mapFront: null,
    pFront: null,
    pBack: null,
    layers: null,
    swipe: null,
    
    /**
     * Method: init
     *
     * Parameters:
     * record - {Ext.data.record} a record with the addon parameters
     */
    init: function(record) {
        var lang = OpenLayers.Lang.getCode();
        this.item = new Ext.menu.Item({
            text: record.get("title")[lang],
            iconCls: 'icon',
            qtip: record.get("description")[lang],
            handler: this.showWindow,
            scope: this
        });
        mmap = this.map;
        mapFront = this.createMap();        
        pFront = this.createMapPanel('mapFront', mapFront);
        
        this.layers = this.getLayers();
        return this.item;
    },

    /**
     * Method: destroy
     * Called by GEOR_tools when deselecting this addon
     */
    destroy: function() {
        this.control && this.control.destroy();
        this.control = null;
        this.map = null;
    },
     
    showWindow: function(){
        if (!this.win) {
            this.cbx = new Ext.form.Checkbox({
                checked: true,
                boxLabel: OpenLayers.i18n("sync map extent")
            });
            this.win = new Ext.Window({
                layout: 'fit',
                width: 600,
                height: 450,
                resizable: false,
                iconCls: 'icon',
                closeAction: 'hide',
                plain: true,
                layout:'border',
                items: [{
                region: 'north',
                height: 45,
                items: [this.createForm()]
            },{
                region: 'center',
                items: [pFront]
            }]
                /*buttons: [{
                 text: 'Close',
                 handler: function(){
                 win.hide();
                 }
                 }]*/
            });
        }
        this.update();
        this.win.show();
    },
	
    createForm: function() {
        return new Ext.FormPanel({
            labelWidth: 40, // label settings here cascade unless overridden
            labelAlign: 'left',
            width: '100%',
            frame: true,
            bodyStyle: 'padding:5px 5px 0',
            items: [{
                layout: 'column',
                items: [{
                    columnWidth: .5,
                    layout: 'form',
                    items: [this.createComboBox('cbboxFront','Front', this.layers)]
                }, {
                    columnWidth: .5,
                    layout: 'form',
                    items: [this.createComboBox('cbboxBack','Back',this.layers)]
                }]
            }]
        });
    },
    
    getLayers: function(){
        var layers = new Array();
        var layer = null;
        var layersVisible = this.map.layers;

        for(var i=layersVisible.length -1 ; i>= 0 ; i--){
            layer = this.map.layers[i];
            if (layer.CLASS_NAME === "OpenLayers.Layer.WMS" && layer.visibility) {
                layers.push([layer.id,layer.name]);
            }
        }

        return new Ext.data.ArrayStore({
            fields: ['abbr','layer'],
            data : layers 
        });
    },
            
    createComboBox: function(id, field, store){
        var combo = new Ext.form.ComboBox({
            id: id,
            store: store,
            displayField:'layer',
            editable:false,
            mode: 'local',
            triggerAction: 'all',
            fieldLabel: field,
            emptyText:'Select a layer...',  
            width: 200,
            onSelect: function(record) {
                var i, newLayer;
                newLayer = mmap.getLayer(record.data.abbr).clone();
                
                if(mapFront.layers.length == 0){
                    newLayer.isBaseLayer=true;
                    mapFront.addLayer(newLayer);
                    newLayer = mmap.getLayer(record.data.abbr).clone();
                    mapFront.addLayer(newLayer);
                } else {
                    if(this.id == "cbboxFront"){
                        mapFront.removeLayer(mapFront.layers[1]);
                        mapFront.addLayer(newLayer);
                    } else if(this.id == "cbboxBack") {
                        swipe.deactivate();
                        var layer = mapFront.layers[1].clone();
                        for(i=mapFront.layers.length -1 ; i >= 0 ; i--){
                            mapFront.removeLayer(mapFront.layers[i]);
                        }
                        newLayer.isBaseLayer=true;
                        mapFront.addLayer(newLayer);
                        mapFront.addLayer(layer);
                        swipe.activate();
                    }
                }
                mapFront.zoomToScale(mmap.getScale());
                this.setValue(record.data.layer);
                this.collapse();
            }
        });
        return combo;
    },
    
    createMap: function(){
        var map = new OpenLayers.Map({
            projection: this.map.projection,
            units: this.map.units,
            scales: this.map.scales
        });
        swipe = new OpenLayers.Control.Swipe({map: map});
        map.addControls([new OpenLayers.Control.LayerSwitcher(),swipe]);
        swipe.activate();
        return map;
    },
            
    createMapPanel: function(id, map){
        return new GeoExt.MapPanel({
            id: id,
            region: "center",
            width: '100%',
            height: 370,
            map: map,
            center: this.map.center,
            zoom: 6
        });
    },
    
    removeLayers: function(map){
        if(map){
            for(var i=map.layers.length -1 ; i >= 0 ; i--){
                map.removeLayer(map.layers[i]);
            }
        }
    },
    
    update: function(){
       
    }
};