module.exports = (function() {
    $$.component("mg-modal", {
        template: "<slot></slot>",
        ready: function() {
            var that = this, $el = $(this.$el), paras, scope,
                view, clen, ctrl, show, handle, mroot, option;

            ctrl  = $el.attr("ctrl");
            show  = $el.attr("show");
            scope = $$.getVm(that);
            mroot = $el.attr("root") == "true";
            paras = $el.attr("params");

            if (scope[ctrl] !== undefined || scope[show] !== undefined) {
                view  = $el.attr("view");
                clen  = $el.children.length;
                paras = scope[paras] || {};

                option = {
                    align    : $el.attr("align"),
                    autoHide : false,
                    backShow : true,
                };

                if (mroot /* 为真说明要在根元素上弹框 */) {
                    handle = $$._WRAP_.modal($el, option);
                } else {
                    handle = scope.MG_PAGE.wrapper.modal($el, option);
                }

                that._HANDLE_ = handle;
                $el.removeAttr("ctrl show align");

                if (scope[ctrl] !== undefined) {
                    scope[ctrl] = handle;
                }

                if (view && view != "true" && view !== true) {
                    var _view = $$.renderView(view, $el, paras),
                        _call = scope[$el.attr("call")], load = $.defer();

                    // 页面渲染后，将子页面的 句柄 暴露出来
                    if (_view.$children[0] && scope[ctrl] !== undefined) {
                        load.resolve(_view.$children[0]);
                    } else {
                        _view.$on("mgViewRender", function(childScope) {
                            load.resolve(childScope);
                        });
                    }

                    load.then(function(childScope) {
                        childScope._MODAL_PARENT = scope;
                        // 弹框会修改DOM结构，手动修复 $parent 对象
                        childScope.$parent       = scope;
                        childScope._MODAL_       = handle;

                        if ($.isFun(_call)) {
                            childScope._MODAL_CALL = _call;
                        }

                        // 监听 ui_back 事件，发生则隐藏自身
                        childScope.$on("_ui_back", function() {
                            handle.hide();
                            childScope.$emit("mgViewHide");
                        })

                        handle.view = childScope;
                    })
                }

                that.$on("mgViewHide", function() {
                    handle.hide();
                })
            } else {
                $el.addClass("hide");
            }
        }
    });
})();
