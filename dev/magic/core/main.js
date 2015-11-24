require("extend");      // 原生对象扩展

(function(window, undefined) {
    var Magic = (function() {
        /* 一个简单的实例对象初始化方法 */
        var magic = function(select) {
                return new magic.fn._init(select);
            },
            _UTIL  = require("util"),
            _DOM   = require("dom"),
            _EVENT = require("event"),
            _TPL   = require("templayed");

        magic.fn = magic.prototype = {
            constructor: Magic,
            /* magic对象构造器 */
            _init: function(select, content) {
                // 如果传入的是一个函数，则添加一个自执行函数
                if (typeof select === "function") {
                    return magic.ready(select);
                } else if (typeof select === "string") {
                    this.length = 0;    // 默认无元素

                    // 判断是否为创建DOM的字符串
                    if (_DOM.check(select)) {
                        var make = _DOM.make(select);
                        if (make.childNodes.length == 1) {
                            this[0] = make.childNodes[0];
                        } else {
                            this[0] = make;
                        }

                        this.length = 1;
                    } else {
                        // 否则直接尝试查找对象
                        var qur = magic.query(select, content);
                        if (qur && qur.length /* 是否返回数组 */) {
                            if (qur.length > 0) {
                                this[0] = qur[0];
                                this.length = 1;
                            }
                        } else if (qur instanceof Element) {
                            this[0] = qur;  // 只有一个对象时直接赋值
                            this.length = 1;
                        }
                    }
                } else if (select instanceof Element) {
                    // 如果是DOM对象，返回包装的对象
                    this[0] = select;
                    this.length = 1;
                } else if (select === document || select === window) {
                    this[0] = select;
                    this.length = 1;
                } else if (select instanceof Magic) {
                    return select;
                }
                
                return this.length > 0 ? this : null;
            },

            /* 简单的查询方法，返回标准的dom对象 */
            query: function(select) {
                return require("query")(select, this[0]);
            },

            /* 在子类中查找对象 */
            find: function(select) {
                return new magic.fn._init(select, this[0]);
            },

            /* 对象的类操作的一些方法 */
            hasClass: function(className) {
                return this[0] ? _UTIL.hasClass(this[0], className) : false;
            },
            addClass: function(className) {
                this[0] && _UTIL.addClass(this[0], className);

                return this;
            },
            removeClass: function(className) {
                this[0] && _UTIL.removeClass(this[0], className);

                return this;
            },
            toggleClass: function(className, set) {
                this[0] && _UTIL.toggleClass(this[0], className, set);
                
                return this;
            },

            /* 只有两种状态的元素切换样式 */
            switchClass: function(cls, active) {
                if (active /* 激活状态 */) {
                    this.addClass(cls.on||'');
                    this.removeClass(cls.off||'')
                } else {
                    this.removeClass(cls.on||'');
                    this.addClass(cls.off||'')
                }

                return this;
            },

            tagName: function() {
                var tagname = this[0] && this[0].tagName;

                return tagname ? tagname.toLocaleLowerCase() : "";
            },

            offset: function() {
                return this[0] && _UTIL.offset(this[0]) || null;
            },

            /* 获取表单元素的值 */
            val: function(val) {
                if (val !== undefined) {
                    if (this[0]) this[0].value = val;
                } else {
                    return this[0] && this[0].value || null;
                }
            },

            /* 对象的属性操作的一些方法 */
            attr: function(attr, val) {
                return _UTIL.attr(this[0], attr, val);
            },

            removeAttr: function(attr) {
                _UTIL.removeAttr(this[0], attr);

                return this;
            },

            /* 对象的 DATA 操作 */
            data: function(key, val) {
                if (!this[0]) return;
                return _UTIL.data(this[0], key, val);
            },

            removeData: function(key) {
                if (this[0]) _UTIL.removeData(this[0], key);

                return this;
            },

            /* 对象事件操作的简单方法 */
            on: function(type, select, fn, capture) {
                if (this[0] /* 有对象才绑定 */) {
                    _EVENT.bind(this[0], type, select, fn, capture);
                }

                return this;
            },

            off: function(type, fn, capture) {
                if (this[0] /* 有对象才绑定 */) {
                    _EVENT.unbind(this[0], type, fn, capture);
                }

                return this;
            },

            once: function(type, select, fn, capture) {
                if (this[0] /* 有对象才绑定 */) {
                    _EVENT.once(this[0], type, select, fn, capture);
                }

                return this;
            },

            trigger: function(type /* data... */) {
                if (this[0] /* 有对象才绑定 */) {
                    var argv = [this[0]]; // 修复参数列表
                    for(var i=0; i<arguments.length; i++) {
                        argv.push(arguments[i]);
                    }

                    _EVENT.trigger.apply(null, argv);
                }

                return this;
            },

            css: function(attr, val) {
                if (!this[0]) return;

                if (val == undefined) {
                    return getComputedStyle(this[0])[attr];
                } else {
                    return this[0].style[attr] = val;
                }
            },

            /* 简单的获取元素的高度和宽度 */
            height: function(val) {
                if (!this[0]) return;

                if (val && parseFloat(val) >= 0) {
                    this.css("height", parseFloat(val)+"px");
                } else {
                    return this.css("height").replace("px", '');
                }
            },

            width: function(val) {
                if (!this[0]) return;

                if (val && parseFloat(val) >= 0) {
                    this.css("width", parseFloat(val)+"px");
                } else {
                    return this.css("width").replace("px", '');
                }
            },

            /* 将自身从父元素中删除，如果可以的话 */
            remove : function() {
                return _DOM.remove(this[0]);
            },

            /* 获取当前元素在父类中的位置 */
            index : function() {
                var parent = this.parent(), items;

                if (parent) {
                    parent = parent[0];
                    items  = parent.children;

                    for(var i=0; i<items.length; i++) {
                        if (items[i] == this[0]) {
                            return i;
                        }
                    }
                }

                return -1;  // 默认返回 -1
            },

            /* 精简的模板引擎 */
            tpl : function(template, datas) {
                if (template != undefined) {
                    var html = _TPL(template)(datas);

                    this.html(html);    // 更新当前元素内容
                }

                return this;
            },

            /* 设置或读取元素的内联HTML内容 */
            html : function(html) {
                if (!this[0]) return this;

                if (html != undefined /* 有值时设置值并返回自身 */) {
                    this[0].innerHTML = html;
                    return this;
                } else {
                    return this[0].innerHTML;
                }
            },

            text : function(text) {
                if (!this[0]) return this;

                if (text /* 有值时设置值并返回自身 */) {
                    this[0].innerText = text;
                    return this;
                } else {
                    return this[0].innerText;
                }
            },

            /* 为对象添加HTML对象或者字符串 */
            append: function(text) {
                if (text instanceof Magic) {
                    text = text[0];
                }
                this[0] = _DOM.append(this[0], text);
                return this;
            },

            appendTo: function(select) {
                var $to = new magic.fn._init(select);
                $to && $to.append(this);

                return this;
            },

            insertBefore: function(text) {
                if (text instanceof Magic) {
                    text = text[0];
                }
                this[0] = _DOM.prepend(this[0], text);
                return this;
            },

            /* 元素前插入对象操作的方法 */
            before: function(html) {
                if (text instanceof Magic) {
                    text = text[0];
                }
                _DOM.before(this[0], html);

                return this;
            },

            /* 元素后插入对象操作的方法 */
            after: function(html) {
                if (html instanceof Magic) {
                    html = html[0];
                }
                _DOM.after(this[0], html);

                return this;
            },

            /* 元素外包裹元素 */
            wrap: function(html) {
                if (html instanceof Magic) {
                    html = html[0];
                }
                _DOM.wrap(this[0], html);

                return this;
            },

            /* 选择元素的所有子元素外包裹dom */
            wrapAll: function(html) {
                if (html instanceof Magic) {
                    html = html[0];
                }
                _DOM.wrapAll(this[0], html);

                return this;
            },

            /* 简单判断元素渲染完成后执行某操作 */
            render: function(call) {
                var handle, that = this, argv = [];

                for(var i = 1; i<arguments.length; i++)
                    argv.push(arguments[i]);
                handle = setInterval(function() {
                    if (that.width() > 0 && that.height() > 0) {
                        if (typeof call == "function")
                            call.apply(null, argv);
                        clearInterval(handle);
                    }
                }, 20);

                return handle;
            },

            /* 对象的父元素和子元素操作方法 */
            parent: function() {
                var parent = _DOM.parent(this[0]);

                if (parent) return magic(parent);
            },

            children: function() {
                var children = null;  // 存放子类元素
                if (this[0] /* 有对象时执行 */) {
                    children = this[0].children;
                }

                if (children) return magic(children[0]);
            }
        }

        /* 重设init的原型对象链接，使之可以调用magic.fn的方法和属性 */
        magic.fn._init.prototype = magic.fn;
        magic.extend = magic.fn.extend = _UTIL.extend;

        /* 绑定一些常用的静态方法 */
        magic.extend({
            /* 简单的查询方法，返回标准的dom对象 */
            query: require("query"),

            /* 简易的模板引擎 */
            tpl : function(template, datas) {
                var html = "";

                if (template != undefined) {
                    html = _TPL(template)(datas);
                }

                return html;    // 返回渲染后的数据
            },

            isFun: _UTIL.isFun,

            /* 返回一个节流执行的函数 */
            delayCall: _UTIL.delayCall,

            /* 返回一个只执行一次的方法 */
            onceCall: _UTIL.onceCall,

            /* 返回一个随机数字字符串 */
            getRandom: _UTIL.getRandom,

            /* 返回当前时间的时间戳 */
            getTime: _UTIL.getTime,

            /* 返回一个继承了给定父类的所有方法和属性的新对象 */
            inheart: _UTIL.inheart,

            /* 实现一个继承方法，可以重写，调用，覆盖父类方法 */
            class: _UTIL.class,

            /* 尽可能快的在dom加载完成后执行给定函数 */
            ready: require("domready"),

            /* promise 的支持 */
            defer: function() {
                var promise = require("promise");

                return new promise();
            },

            /* 函数懒执行方法，用于在初始化后才真正执行方法 */
            callDefer: function(name, scope, defer, call) {
                if (!name || !scope || !defer) return call;

                var calls = [];     // 存放每次调用时的参数

                defer.then(function() {
                    for(var i=0; i<calls.length; i++) {
                        call.apply(scope, calls[i]);
                    }

                    scope[name] = call; // 替换缓存函数
                });

                return function() {
                    calls.push(arguments);
                }
            },

            /* 检测到某个对象时候执行方法 */
            checkRun: function(check, call, scope, timeout, time) {
                var start = $.getTime(), handle;

                scope = scope || window;    // 修复执行作用域

                handle = setInterval(function() {
                    if ((timeout && ($.getTime() - start) >= timeout) ||
                        (scope && scope[check])) {

                        call.apply(scope);
                        clearInterval(handle);
                    }
                }, time || 100);
            },

            /* 一个简易的转换json的方法 */
            parseJSON: function(str) {
                // 去掉首尾括号,方便后续处理
                str = str.replace(/^\{+/, '');    
                str = str.replace(/\}+$/, '');

                var arr = str.split(","), item, key, ret = {};

                for(var i=0; i<arr.length; i++) {
                    item = arr[i];
                    item = item.replace(/\s+/g, ' ');
                    item = item.replace(/[\'*|\"*]/g, '');
                    key  = item.match(/.*(?=\:)/)[0];
                    key  = key.replace(/\s+/g, '');
                    ret[key] = item.replace(/^.*\:\s*/g, "");
                }

                return ret;
            },

            jsonp: function(url, data) {
                var jsonp = require("jsonp"), callname, defer;

                defer = this.defer();       // 创建一个defer
                data  = data || {};         // data空是创建空对象

                // 如果传入了后台回调方法，则设置，否则默认
                callname = data.jsonp || "callback";    
                data.jsonp && delete data.jsonp;    // 删除属性

                // 参数过滤，剔除空值
                for (var key in data) {
                    if (!data[key]) {
                        delete data[key];
                    }
                }

                jsonp({ url: url, data: data,
                    callbackName: callname,
                    success: function(data) {
                        defer.done(data)
                    }
                })

                return defer;   // 返回参数
            },

            isfun: function(fun) {
                return typeof fun == "function";
            }
        })

        return magic;   // 返回最后的对象
    })();

    window.$ = Magic;
})(window);

require("../mui/muicore.js");       // 加载核心UI组件
require("../plug/main.js");         // 加载硬件扩展方法
require("../lib/minjs/route.js");   // 路由对象
