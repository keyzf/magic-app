module.exports = (function() {
	Vue.directive("timer", {
        bind: function() {
            var $el = $(this.el), val = this.raw, ctrl, scope = this.vm;

            if (scope[val] !== undefined /* 值存在的话 */) {
                var format, text, filter, show, min, max, call, init, date;

                call = $el.attr("call");
                date = $el.attr("date");

                ctrl = $.timer({
                	format: $el.attr("format"),
                	show  : $el.attr("show"),
                	text  : $el.attr("text"),

                	filter: scope[$el.attr("filter")],
                	min   : $el.attr("min"),
                	max   : $el.attr("max"),

                	call  : function(text, date, handle) {
                		var ret;	// 回调的结果

                		if ($.isFun(scope[call])) {
                			ret = scope[call](text, date);
                		}

                		if (ret !== false) {
                			scope[val] = text;
                			if (scope[date] !== undefined) {
                				scope[date] = date;
                			}
                		}
                	}
                }, $el.attr("init"))

                $el.on("tap", function() {
                	ctrl.show();
                })

                scope.$on("pageDestroy", function() {
                    ctrl.destroy();   // 删除自身
                })
            }
        }
    })
})();