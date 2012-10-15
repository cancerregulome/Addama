Controller = {
    testwindow : {
        view : function() {
            var WinView = require('../views/window_view');
            var winView = new WinView();
            $('#mainDiv').html(winView.render().el);
        }
    },

    grid : {
        view : function() {
            var GridView = require('../views/grid_view');
            var gridView = new GridView();
            $('#mainDiv').html(gridView.render().el);
            gridView.renderGrid();
        }
    },

    app : {
        layout : function() {
            var TopNavBar = require('../views/topbar_view');
            var topnavbar = new TopNavBar();
            $('#navigation-container').append(topnavbar.render().el);
        }
    },

    graph : {
        view : function() {
            var GraphView = require('../views/graph_view');
            var graphView = new GraphView();
            $('#mainDiv').html(graphView.render().el);
        }
    },

    pwpv :  {
        view : function() {
            var PwPvView = require('../views/pwpv_view');
            var pwpvView = new PwPvView();
            $('#mainDiv').html(pwpvView.render().el);
            pwpvView.renderGraph();
        }
    },

    twod : {
        view : function(label1, label2) {
            var TwoD = require('../views/2D_Distribution_view');
            var FL = require('../models/featureList');
            var fl = new FL({
                websvc: '/endpoints/filter_by_id?filepath=%2Ffeature_matrices%2F2012_09_18_0835__cons.fm&IDs=',
                feature_list : [label1, label2]
            });
            var twoDView = new TwoD({collection: fl});
            fl.fetch();
            $('#mainDiv').html(twoDView.render().el);
        }
    },

    oncovis : {
        view : function() {
            var Oncovis = require('../views/oncovis_view');
            var oncovisView = new Oncovis();
            $('#mainDiv').html(oncovisView.render().el);
        }
    },

    home : {
        view : function() {
            var HomeView = require('../views/home_view');
            var homeView = new HomeView();
            $('#mainDiv').html(homeView.render().el);
        }
    },

    route_analysis: function(analysis_type, dataset_id, remainder) {

        var arg_array = remainder.length ? remainder.split('/') : [],
            len = arg_array.length,
            features = arg_array.slice(0, len - 1),
            view_name = '';

        if (len > 0) { //if there's param (even an empty one)
            view_name = arg_array[len - 1];
        }

        //graph based analysis
        if (_(['rf-ace','mds','pairwise']).contains(analysis_type)) {
            if (len <= 2) {  // 1 or no parameters.  just draw vis of analysis
                Model = require('../models/graph');
                model = new Model({analysis_id : analysis_type, dataset_id : dataset_id});
                return Controller.ViewModel(view_name || 'graph', model);
            }

            Model = require('../models/featureList');
            model = new Model({analysis_id : analysis_type, dataset_id : dataset_id, features: features});
            return Controller.ViewModel(view_name, model);
        }

        if (analysis_type === 'mutations') {
            Model = require('../models/mutations');
            model = new Model({analysis_id : analysis_type, dataset_id : dataset_id });
            return Controller.ViewModel(view_name, model);
        }

        if (analysis_type === 'information_gain') {
            Model = require('../models/genomic_featureList');
            model = new Model({analysis_id : analysis_type, dataset_id : dataset_id });
            return Controller.ViewModel(view_name, model);
        }

        //tabular data like /feature_matrices
        if (view_name == 'heat') {
            OncovisDims = require('../models/oncovis_dims');
            oncovisDims = new OncovisDims({dataset_id : dataset_id });
            oncovisDims.fetch({success: function(model) {
                model.trigger('load');
            }});

            Model = require('../models/featureMatrix2');
            model = new Model({analysis_id : analysis_type, dataset_id : dataset_id, dims: oncovisDims });
            return Controller.ViewModel(view_name || 'grid', model);
        }

        Model = require('../models/featureMatrix');
        model = new Model({analysis_id : analysis_type, dataset_id : dataset_id, features: features});
        return Controller.ViewModel(view_name, model);
    },

    ViewModel: function(view_name, model) {
        var supported = {
            "graph": "graph_view",
            "grid": "grid_view",
            "circ": "circ_view",
            "heat": "oncovis"
        };
        var expected = ["twoD", "kde", "parcoords"];

        if (!_.contains(_.keys(supported), view_name)) {
            console.log("View [" + view_name + "] not supported : expecting one of these [" + _.keys(supported).join(",") + "] :: soon to be supported [" + expected.join(",") + "]");
            return;
        }

        var ViewClass = require('../views/' + supported[view_name]);
        var view = new ViewClass({model:model});
        $('#mainDiv').html(view.render().el);

        model.fetch({
            success: function(model, resp) {
                var original_model;
                if (Model.prototype.add) {  //is this a Collection?
                    original_model = new Model({analysis_id : model.analysis_type, dataset_id : model.dataset_id});
                    original_model.add(model.toJSON(), {silent:true});
                } else { //nope its a model
                    original_model = new Model(model.toJSON());
                }
                model.original(original_model);
                model.trigger('load');
            }
        });
    }
};

module.exports = Controller;