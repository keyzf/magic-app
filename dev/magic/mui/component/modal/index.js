require("./style.scss");

module.exports = (function() {
    var Modal = function(element, option) {
        this.el      = $(element);
        this.isHide  = false;
        this.option  = $.extend({}, Modal.DEFAULT, option, true);
    };

    Modal.DEFAULT = {
        align: "bottom",
        autoHide: true,
        hasInsert: false
    }

    Modal.prototype.init = function() {
        var mid = "modal_"+$.getRandom(), html, opt = this.option;

        if (opt.hasInsert /* 已插入页面直接处理 */) {
            this.el.attr("id", mid);
            this.el.addClass("hideOut");
        } else {
            html  = "<div class='modal hideOut' id='"+mid+"'>";
            this.el.addClass("modal_body");
            html += this.el[0].outerHTML+"</div>";
            $("body").append(html);     // 添加到页面中
            this.el.remove();           // 旧元素从页面删除 
        }
        
        this.el = $("#"+mid);      //  获得对象的句柄
        this.el.addClass("align"+opt.align.toUpFirst());

        if (opt.autoHide /* 绑定默认关闭方法 */) {
            var that = this, ele = this.el[0];
            that.el.on("touchend", function(event) {
                if (event.target == ele) {
                    that.hide();    // 隐藏自己
                    event.stopPropagation();
                }
            })
        }

        if (this.el.hasClass("hideOut")) {
            this.isHide = true; // 设置隐藏状态
        }

        return this;
    };

    Modal.prototype.show = function(anim) {
        var scroll = this.el.data("ui_scroll");
        if (scroll) scroll.scrollTo(0, 0);

        this.isHide = false;
        this.el.removeClass("hideOut").addClass("showIn");
        
        return this;
    };

    Modal.prototype.hide = function(anim) {
        this.isHide = true;
        this.el.removeClass("showIn").addClass("hideOut");
        return this;
    };

    Modal.prototype.toggle = function() {
        return this.isHide ? this.show(): this.hide();
    };

    Modal.prototype.destroy = function() {
        this.el.remove();   // 删除自身
    };

    /* 尝试绑定方法到 magic 框架的全局对象上 */
    if ($ && !$.modal) {
        $.extend({modal: function(element, option) {
            return new Modal(element, option).init();
        }});
    };

    if ($ && $.fn && !$.fn.modal) {
        $.fn.extend({modal: function(option) {
            var opt = $.extend({}, option);
            opt.hasInsert = true;
            return new Modal(this[0], opt).init();
        }});
    };
})();