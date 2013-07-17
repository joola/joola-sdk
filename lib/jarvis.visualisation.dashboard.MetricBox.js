// Copyright 2012 Joola. All Rights Reserved.
//
// Licensed under the Jarvis License Agreement (the "License");
// you may not use this file except in compliance with the License.
// You may obtain a copy of the License at
//
//      http://jarvis.joo.la/client/license
//
// Unless required by applicable law or agreed to in writing, software
// distributed under the License is distributed on an "AS-IS" BASIS,
// WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
// See the License for the specific language governing permissions and
// limitations under the License.

/**
 * @fileoverview Provides a realtime visualisation to display current server date and time.
 *
 */


jarvis.provide('jarvis.visualisation.dashboard.MetricBox');

jarvis.require('jarvis.debug');
jarvis.require('jarvis.date');
jarvis.require('jarvis.string');

//jarvis.require('jarvis.dashboard');
jarvis.require('jarvis.visualisation.dashboard');

/**
 * Create and install a realtime timeline handler.
 * @constructor
 * @param {string=} options optional options to be passed to class
 */

jarvis.visualisation.dashboard.MetricBox = function (options) {
    var start = new Date().getMilliseconds();

    this._this = this;
    this.options = options;

    this.default_caption = 'Right now';
    this.default_subcaption = 'Events per Second';
    this.default_useAverage = true;

    this.key = '';

    this.initialized = false;
    this.gettingBackData = false;
    this.initialCallbacks = [];
    this.initialTimestamp = null;
    this.Resolution = 'Day';
    this.containers = [];

    this.DateBox = jarvis.visualisation.picker.DateBox;

    jarvis.objects.Dimensions.List();
    jarvis.objects.Metrics.List();

    var executionTime = new Date().getMilliseconds() - start;
    //jarvis.debug.log('INFO', 'jarvis.visualisation.dashboard.MetricBox', 5, '...Constructor (' + executionTime + 'ms)');
};


/**
 * Inits the class and builds the base html for it.
 * @param {string=} container An optional container to apply the class to.
 */
jarvis.visualisation.dashboard.MetricBox.prototype.init = function (options, container) {
    var _this = this;
    var start = new Date().getMilliseconds();

    this._this = this;
    this.options = $.extend({
        minichart: {
            height: 18,
            width: 75
        }
    }, options);

    this.containers = this.containers || [];
    this.metrics = [];

    //this.DateBox = jarvis.visualisation.picker.DateBox;

    //lookup any containers relevant for the timeline
    var matchedContainers = null;
    if (container)
        matchedContainers = $(container);
    else
        matchedContainers = $('.jarvis.dashboard.metricbox');
    if (matchedContainers.length == 0)
        return;

    //_this.Container = matchedContainers;

    $(matchedContainers).each(function (index, item) {
        if (!$(this).parent().hasClass('prettyprint')) {
            jarvis.debug.log('INFO', 'jarvis.visualisation.dashboard.MetricBox', 6, 'Applying to container (\'' + this.id + '\')');

            var _height = $(item).attr('data-minichart-height');
            if (_height)
                _this.options.minichart.height = _height;

            var _width = $(item).attr('data-minichart-width');
            if (_width)
                _this.options.minichart.width = _width;

            var _metrics = $(item).attr('data-metrics');
            if (!_metrics)
                return;
            _metrics = _metrics.split(',');
            $(_metrics).each(function (index, item) {
                _metrics[index] = $.trim(_metrics[index]);
                _this.metrics.push(_metrics[index]);
            });

            $(jarvis.objects.Metrics).each(function (index, item) {
                if (_metrics.indexOf(item.id) > -1)
                    _this.metrics[_metrics.indexOf(item.id)] = item;
            });

            $(this).bind('data', function (evt, ret) {
                ret.data = $(this).data().data;
            });

            $(this).bind('click', function (evt) {
                $(this).trigger('clicked', $(this).data().data);
            });

            $(jarvis.visualisation.report).bind('filter', function (filter) {
                _this.fetch(_this);
            });

            $(item).empty();
            _this.draw(item);
            _this.fetch(_this, item);

            $(this).find('.settings').off('click');
            $(this).find('.settings').on('click', function (e) {
                jarvis.getDashboard().showEditWidget({_this: jarvis.getDashboard(), container: jarvis.getDashboard().container, addNew: false, widgetID: $(item).attr('data-widgetid'), sender: _this, sendercontainer: item });
            });

            _this.containers.push(item);
        }
    });

    $(_this.DateBox).bind('datechange', function () {
        $(_this.containers).each(function (i, container) {
            _this.fetch(_this, container);
        })
    });

    var executionTime = new Date().getMilliseconds() - start;
    jarvis.debug.log('INFO', 'Jarvis.Visualisation.Dashboard.MetricBox', 5, '...init (' + executionTime + 'ms)');
};

/**
 * Inits the class and builds the base html for it.
 * @return (string) returns the base html to be applied in the container
 */

jarvis.visualisation.dashboard.MetricBox.prototype.fetch = function (sender, container) {
    if (!sender)
        sender = jarvis.visualisation.dashboard.MetricBox;

    var _this = sender;

    var startdate = jarvis.visualisation.picker.DateBox.getDate().base_fromdate;
    var enddate = jarvis.visualisation.picker.DateBox.getDate().base_todate;
    if (_this.DateBox.comparePeriod) {
        var compare_startdate = jarvis.visualisation.picker.DateBox.getDate().compare_fromdate;
        var compare_enddate = jarvis.visualisation.picker.DateBox.getDate().compare_todate;
    }

    var _metrics = $(container).attr('data-metrics');
    if (!_metrics)
        return '';
    _metrics = _metrics.split(',');
    $(_metrics).each(function (index, item) {
        var imetric = -1;
        $(jarvis.objects.Metrics).each(function (i, o) {
            if (o.id == $.trim(item))
                imetric = i;
        })
        _metrics[index] = jarvis.objects.Metrics[imetric];
    });

    if (typeof _metrics[0] == 'undefined')
        return '';

    $(_metrics).each(function (index, metric) {
        var queryOptions = [];
        var _queryOptions = {
            id: 'primary',
            startdate: jarvis.date.formatDate(startdate, 'yyyy-mm-dd hh:nn:ss.000'),
            enddate: jarvis.date.formatDate(enddate, 'yyyy-mm-dd hh:nn:ss.999'),
            dimensions: 'date.date',
            metrics: metric.id,
            resolution: _this.Resolution,
            omitDate: false,
            filter: jarvis.visualisation.dashboard.globalfilter
        };
        queryOptions.push(_queryOptions);

        _queryOptions = {
            id: 'primary_total',
            startdate: jarvis.date.formatDate(startdate, 'yyyy-mm-dd hh:nn:ss.000'),
            enddate: jarvis.date.formatDate(enddate, 'yyyy-mm-dd hh:nn:ss.999'),
            dimensions: '',
            metrics: metric.id,
            resolution: _this.Resolution,
            omitDate: true,
            filter: jarvis.visualisation.dashboard.globalfilter
        };
        queryOptions.push(_queryOptions);

        if (_this.DateBox.comparePeriod) {
            _queryOptions = {
                id: 'compare_primary',
                startdate: jarvis.date.formatDate(compare_startdate, 'yyyy-mm-dd hh:nn:ss.000'),
                enddate: jarvis.date.formatDate(compare_enddate, 'yyyy-mm-dd hh:nn:ss.999'),
                dimensions: 'date.date',
                metrics: metric.id,
                resolution: _this.Resolution,
                omitDate: false,
                filter: jarvis.visualisation.dashboard.globalfilter
            };
            queryOptions.push(_queryOptions);

            _queryOptions = {
                id: 'compare_primary_total',
                startdate: jarvis.date.formatDate(compare_startdate, 'yyyy-mm-dd hh:nn:ss.000'),
                enddate: jarvis.date.formatDate(compare_enddate, 'yyyy-mm-dd hh:nn:ss.999'),
                dimensions: '',
                metrics: metric.id,
                resolution: _this.Resolution,
                omitDate: true,
                filter: jarvis.visualisation.dashboard.globalfilter
            };
            queryOptions.push(_queryOptions);
        }

        if (jarvis.visualisation.dashboard.globalfilter && jarvis.visualisation.dashboard.globalfilter != '') {
            var _queryOptions = {
                id: 'total',
                startdate: jarvis.date.formatDate(startdate, 'yyyy-mm-dd hh:nn:ss.000'),
                enddate: jarvis.date.formatDate(enddate, 'yyyy-mm-dd hh:nn:ss.999'),
                dimensions: 'date.date',
                metrics: metric.id,
                resolution: _this.Resolution,
                omitDate: false,
                filter: ''
            };
            queryOptions.push(_queryOptions);
        }
        if (_this.DateBox.comparePeriod && jarvis.visualisation.dashboard.globalfilter && jarvis.visualisation.dashboard.globalfilter != '') {
            _queryOptions = {
                id: 'compare_total',
                startdate: jarvis.date.formatDate(compare_startdate, 'yyyy-mm-dd hh:nn:ss.000'),
                enddate: jarvis.date.formatDate(compare_enddate, 'yyyy-mm-dd hh:nn:ss.999'),
                dimensions: 'date.date',
                metrics: metric.id,
                resolution: _this.Resolution,
                omitDate: false,
                filter: ''
            };
            queryOptions.push(_queryOptions);
        }

        jarvis.dataaccess.multifetch(_this, '/query.fetch', queryOptions, function (sender, data, error) {
            var series = [];
            $(data).each(function (index, item) {
                try {
                    //var result = $.parseJSON(item.data).Result;
                    //var request = $.parseJSON(item.data).Request;
                    //var _data = $.parseJSON(item.data).Result.Rows;
                    if (item.id == 'primary' || item.id == 'compare_primary') {
                        var result = item.data.Result;
                        var request = item.data.Request;
                        var _data = item.data.Result.Rows;
                        var points = {
                            total: 0,
                            ftotal: 0,
                            data: [],
                            id: item.id
                        };
                        $(_data).each(function (i, row) {

                            var point = {
                                value: row.Values[1],
                                fvalue: row.FormattedValues[1]
                            };
                            points.total += parseFloat(point.value);
                            points.data.push(point);



                        });

                        if (metric.aggregation == "avg" || metric.aggregation == 'count') {
                            points.avg = points.total / _data.length;
                        }

                        $(data).each(function (i, o) {
                            if (o.id.indexOf(item.id + '_total') == 0) {
                                var _data = o.data.Result.Rows;
                                $(_data[0]).each(function (i, row) {
                                    points.total = parseFloat(row.Values[0]);
                                })
                            }
                        });



                        series.push(points);
                    }
                }
                catch (ex) {
                }
            });

            $(container).off('click');
            $(container).on('click', function () {
                $(jarvis).trigger('jarvis-dashboard-metricbox-click', [metric])
            });

            if (_this.DateBox.comparePeriod == false) {
                _this.update(sender, metric, series, container);
            }
            else
                _this.updateCompare(sender, metric, series, container);
        });
    });
};

jarvis.visualisation.dashboard.MetricBox.prototype.update = function (sender, metric, series, container) {
    var _this = sender;

    if (!series[0])
        return;

    $(series).each(function (si, so) {
        if (metric.type == 'int')
            so.ftotal = jarvis.string.formatNumber(so.total, 0, true);
        else if (metric.type == 'float')
            so.ftotal = jarvis.string.formatNumber(so.total, 0, true);
        else
            so.ftotal = jarvis.string.formatNumber(so.total, 0, true);

        if (metric.suffix && metric.suffix != '')
            so.ftotal += metric.suffix;
        if (metric.prefix && metric.prefix != '')
            so.ftotal = metric.prefix + so.ftotal;
    });




    $(series[0]).each(function (si, so) {
        ($(container).find('.compare')).hide();
        var $metric = ($(container).find('.base'));

        var totalsum = so.total;

        try {
            var dataTable = new google.visualization.DataTable();
            dataTable.addColumn('number');
            dataTable.addRows(so.data.length);


            $(so.data).each(function (i, row) {
                //totalsum += parseInt(row.value);
                dataTable.setValue(i, 0, Math.round(parseFloat(row.value)));
            });
        }
        catch (ex) {
            //no google included
        }

        var datebox = jarvis.visualisation.picker.DateBox;
        var ratio;
        if (metric.aggregation == "avg" || metric.aggregation == 'count') {
            ratio = 0;
            if (series[0].total > 0)
                ratio = percentageChange((series.length == 1 ? series[0].total : series[1].total), series[0].total);
            if (series.length == 1)
                $metric.find('.site').html('Overall Avg: <span class="summaryvalue">' + (metric.suffix == 'seconds' ? jarvis.string.intToTime(so.total) : so.ftotal ) + '</span><br> (' + jarvis.string.formatNumber(ratio, 2) + '%)');
            else {
                $metric.find('.site').html('% of Total: <span class="summaryvalue">' + jarvis.string.formatNumber(ratio, 2) + '%</span><br> (' + series[1].ftotal + ')');
            }
        }
        else {
            ratio = 100;
            if (totalsum > 0)
                ratio = series[0].total / (series.length == 1 ? series[0].total : series[1].total) * 100;
            if (!jarvis.visualisation.dashboard.globalfilter || jarvis.visualisation.dashboard.globalfilter == '')
                $metric.find('.site').html(jarvis.string.formatNumber(ratio, 0) + '% of Total <span class="summaryvalue"></span><br>(' + so.ftotal + ')');
            else {
                $metric.find('.site').html('% of Total: <span class="summaryvalue">' + jarvis.string.formatNumber(ratio, 0) + '%</span><br> (' + series[1].ftotal + ')');
            }
        }

        if (totalsum > 1000000 || totalsum < -1000000) {
            totalsum = jarvis.string.shortenNumber(totalsum);
        }
        else {
            if (metric.type == 'int')
                if (metric.suffix == 'seconds') {
                    totalsum = jarvis.string.intToTime(series[0].total);
                }
                else
                    totalsum = jarvis.string.formatNumber(totalsum, 0, true);
            else if (metric.type == 'float')
                totalsum = jarvis.string.formatNumber(totalsum, 0, true);
            else
                totalsum = jarvis.string.formatNumber(totalsum, 0, true);
        }

        if (metric.suffix && metric.suffix != '' && metric.suffix != 'seconds')
            totalsum += metric.suffix;
        if (metric.prefix && metric.prefix != '')
            totalsum = metric.prefix + totalsum;


        $metric.find('.daterange').html(datebox.formatDate(datebox.getDate().base_fromdate) + ' - ' + datebox.formatDate(datebox.getDate().base_todate));


        if (metric.aggregation == "avg" && metric.suffix != 'seconds') {
            so.avg = jarvis.string.formatNumber(so.avg, 2)
            if (metric.suffix && metric.suffix != '')
                so.avg += metric.suffix;
            if (metric.prefix && metric.prefix != '')
                so.avg = metric.prefix + so.avg;

            $metric.find('.value').html(so.avg);
        }
        else {
            $metric.find('.value').html(totalsum);
        }

        $metric.find('.value').attr('title', totalsum);
        $metric.find('.value').removeClass('negative')
        $metric.find('.value').removeClass('positive');

        try {
            if ($($metric.find('.minichart')).length > 0) {
                var vis = new google.visualization.ImageChart($($metric.find('.minichart')).get(0));
                var goptions = {
                    cht: 'ls',
                    chs: _this.options.minichart.width + 'x' + _this.options.minichart.height,
                    chco: '0077CC',
                    chdlp: 'b',
                    chls: '2',
                    chm: 'B,E6F2FA,0,0,0',
                    chxt: '',
                    chxr: ''
                };
                vis.draw(dataTable, goptions);

            }
        }
        catch (ex) {
            //throw '(drawSpark) ' + 'Exception: ' + ex.message;

        }
    });
};

jarvis.visualisation.dashboard.MetricBox.prototype.updateCompare = function (sender, metric, series, container) {
    var _this = sender;

    if (!series[0])
        return;

    var value = percentageChange(series[1].total, series[0].total);

    var _class = 'neutral';
    if (metric.RatioDirection == -1 && Math.round(parseFloat(value)) < 0)
        _class = 'positive';
    if (metric.RatioDirection == -1 && Math.round(parseFloat(value)) > 0)
        _class = 'negative';
    if (metric.RatioDirection == 1 && Math.round(parseFloat(value)) > 0)
        _class = 'positive';
    if (metric.RatioDirection == 1 && Math.round(parseFloat(value)) < 0)
        _class = 'negative';

    $(series).each(function (si, so) {
        if (metric.type == 'int')
            so.ftotal = jarvis.string.formatNumber(so.total, 0, true);
        else if (metric.type == 'float')
            so.ftotal = jarvis.string.formatNumber(so.total, 0, true);
        else
            so.ftotal = jarvis.string.formatNumber(so.total, 0, true);

        if (metric.suffix && metric.suffix != '')
            so.ftotal += metric.suffix;
        if (metric.prefix && metric.prefix != '')
            so.ftotal = metric.prefix + so.ftotal;
    });

    var $metric = ($(container).find('.base'));
    value = jarvis.string.formatNumber(value, 0) + '%';
    $metric.find('.value').html(value);
    $metric.find('.value').removeClass('negative').removeClass('positive');
    $metric.find('.value').addClass(_class);
    $metric.find('.site').html((metric.suffix == 'seconds' ? jarvis.string.intToTime(series[0].total) : series[0].ftotal) + ' vs ' + (metric.suffix == 'seconds' ? jarvis.string.intToTime(series[1].total) : series[1].ftotal));
};

jarvis.visualisation.dashboard.MetricBox.prototype.baseHTML = function (sender) {
    var _this = sender;

    var $html = $('<div class="wrapper"></div>');
    $html.append('<div class="row-fluid">' +
        '<div class="header">' +
        '<div class="settings"></div>' +
        '<div class="move"></div>' +
        '<h3>' + _this.title + '</h3>' +
        '</div>' +
        '<div class="content">' +
        '<div class="base">' +
        '<div class="daterange"></div>' +
        '<div class="value"></div>' +
        '<div class="minichart"></div>' +
        '<div class="site"></div>' +
        '</div>' +
        '<div class="compare" style="display:none;">' +
        '<div class="daterange"></div>' +
        '<div class="value"></div>' +
        '<div class="minichart"></div>' +
        '<div class="site"></div>' +
        '</div>' +
        '</div>' +
        '' +
        '</div>');
    $();

    return $html
}

jarvis.visualisation.dashboard.MetricBox.prototype.draw = function (container) {
    var _this = this;

    //var metrics = _this.metrics;//$(Container).attr('data-metrics');
    //metrics = metrics.split(',');
    //$(metrics).each(function (index, item) {
    //item = $.trim(item);

    var title = 'TITLE';
    var dimensions = 'DIMENSION';
    var metrics = this.default_subcaption;

    if ($(container).attr('data-title')) {
        title = $(container).attr('data-title');
    }
    if ($(container).attr('data-dimensions')) {
        dimensions = $(container).attr('data-dimensions');
    }
    if ($(container).attr('data-metrics')) {
        metrics = $(container).attr('data-metrics');
    }
    _this.title = title;
    var $html = _this.baseHTML(_this);


    $(container).append($html);
};

jarvis.debug.log('INFO', 'Jarvis.Visualisation.Dashboard.MetricBox', 6, 'JS source loaded');

/**
 * init the Timeline and look for containers
 */
//new jarvis.visualisation.dashboard.MetricBox().init();
