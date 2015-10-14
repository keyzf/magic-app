/**
 * spa应用程序路由库
 */
module.exports = (function() {
    var Route = function(table, options) {
    	this.table   = table;			// 路由表信息
    	this.state   = [];				// 状态信息
        this.last    = {};              // 上一次的路由地址
        this.statpos = 0;               // 记录路由的状态位置
  		this.options = extend({}, Route.DEFAULT, options, true);
    };

    /**
     * table 参数说明
     *
     * TODO: 匹配加上正则功能，比如 /([^\/])/ 表示正则匹配
     * TODO: once 只匹配一次URL的路由功能实现
     *
     * 	'/user': {
	 *		on      : function			// 匹配成功时的回调
	 *		once    : function			// 只匹配一次的URL，和on不共存
	 *		bofore  : function			// 匹配成功，on 回调前执行
	 *		leave   : function			// 页面离开时的回调
	 *
	 *		clear   : false				// 为 true 时清除访问历史，默认 false
	 *		recurse : false				// 覆盖全局设置
	 *
	 *		'/info' : {...}				// 子路由信息
     *	}
     *
     * */


    /* 检测是否为函数 */
    function isFun(call) {
        return typeof call == "function"
    };

    /* 最后一项为真时，表示忽略无效的值 */
    function extend(/* ... */) {
        var argv = arguments, obj = argv[0],
            len = argv.length, undef = false;

        if (argv[len-1] === true) {
            undef = true;
            len -= 1;
        }

        for(var i=1; i<len; i++) {
            var item = argv[i];

            for(var key in item) {
                if (undef && item[key] === undefined) {
                    continue;    
                }

                obj[key] = item[key];
            }
        }

        return obj;
    }

    Route.DEFAULT = {
    	home     : "/home",				// 默认首页
        html5mode: false,               // 是否启用H5模式，启用则省略 # 符号（后台需rewrite）
    	repath   : "",					// 页面未找到时候重置到的页面，为空则跳到首页
    	notcall  : null,				// 页面未找到时候的回调方法
        notpage  : "",                  // 页面未找到的时候，显示的页面
    	before   : null,				// 页面跳转前的回调方法
    	after    : null,				// 页面跳转后的回调方法
    	recurse  : false,				// 路由递归触发方式，forward 正序，backward 反序，默认最后项
    }

    /* 执行给定对象的执行方法，forward 为 true 反向执行 */
    Route.prototype.exec = function(tables, key, ext) {
        var len  = tables.length - 1, last = tables[len], ret,
            type = this.options.recurse, back = type == "backward";   // 方法是否反向调用

        if (type === false /* 只执行最后一个对象 */) {
            if (isFun(last.item[key])) {
                ret = last.item[key](last.para, ext);
            }
        } else {
            for (var i = back?len:0; back?i>=0:i<=len; back?i--:i++) {
                var now = tables[i], item = tables[i].item;

                if (isFun(item[key])) {
                    ret = item[key](now.para, ext);
                }

                if (ret === false) break; // 返回 false 则终止程序执行
            }
        }

        return ret;     // 返回最后执行的结果
    }

    /* 路由初始化方法，repath 为 true，则跳到首页 */
    Route.prototype.init = function(repath) {
        var that = this, opt = that.options, tmp, url;

        /* 初始化项目的路由匹配规则 */
        that.table = Route.prefix(that.table);
        that.bind();            // 绑定全局事件

        if (repath)  {
            tmp = that.fire(opt.home);
            that.go(opt.home, true, false, true);
        }

        return that;
    }

    /* 初始化路由表，设置每个项正确的 正则表达式 */
    Route.prefix = function(table) {
        for (var key in table) {
            if (key.search("/") == 0) {
                
                /* 修正格式(只传了on方法) */
                if (isFun(table[key])) {
                    table[key] = { on: table[key]}
                }

                /* 添加对应项具体的正则语句 */
                table[key].__match = key.replace(/:[^_\/-]*/g, "([^/]*)");
                Route.prefix(table[key]);   // 递归循环处理子项目，直到全部处理完
            }
        }

        return table;
    }

    /* 尝试匹配给定URL的路由信息 */
    Route.prototype.fire = function(url) {
    	url = url == undefined ? this.geturl() : url;              // 修正参数
    	url = "/" + url.replace(/^[#|\/]*/g, "").replace(/\/$/g, "");	   // 替换开头 # 和结尾 /

    	var table = this.table, opt = this.options,
            result = [], tmp, para, key, reg, mat, check;

    	/* 循环匹配路由项目 */
        do {
            for (var key in table) {
                if (key.search("/") === 0) {
                    reg = new RegExp("^"+table[key].__match);
                    mat = url.match(reg);

                    if (mat != null) {
                        para = key.match(reg);
                        var params = {};

                        /* 获取URL上的对应参数变量 */
                        for(var i=1; i<para.length; i++) {
                            tmp = para[i].replace(":", "");
                            params[tmp] = mat[i];
                        }

                        result.push({
                            item : table[key],
                            para : params
                        })

                        url   = url.replace(mat[0], "");        // 已经找到的部分替换掉
                        table = table[key];                     // 重定向table的指向
                        key   = Object.keys(table)[0]; break;   // 重定向key的指向，并结束循环
                    }
                }

                check = key;    //  标记当前已经检测过的项目
            }
        } while (url.length > 0 && check != key);

    	return url.length == 0 && result ? result : null;
    }

    /* 手动触发指定页面的事件方法，match 参数必须给定 */
    Route.prototype.trigger = function(match, before, on) {
        if (!match) return false;   // 参数不足直接退出

        var that = this, opt = that.options, last = that.last,
            now = that.geturl(), rcall, update;

        if (isFun(opt.before)) rcall = opt.before(last.url, now, match);

        // 尝试调用 before后 的回调，如果返回 false，会中止后面页面的回调
        if (isFun(before)) update = before(rcall);     

        /* 如果 before 返回 false，回退到上个页面 */
        if (rcall !== false) {
            if (last && last.match) rcall = that.exec(last.match, "leave", match);

            /* 如果上个页面的 leave 返回 false ，中止本次跳转 */
            if (rcall !== false) rcall = that.exec(match, "before", last.match);

            /* 如果 before 返回 false，中止本次跳转 */
            if (rcall !== false) rcall = that.exec(match, "on", last.match);

            if (isFun(on)) update = on(rcall);         // 尝试调用 on后 的回调
        }

        /* 运行全局的 after 方法 */
        isFun(opt.after) && opt.after(last.url, now, match);
        update !== false && that.update(that.geturl(), match);
    }

    /* 全局绑定时间，监控页面前进后退等操作 */
    Route.prototype.bind = function() {
        var that = this, opt = that.options, last = that.last, change;

        change = window.ontouchstart !== undefined ? "touchstart" : "mouseup";

        window.addEventListener("popstate", function(e) {
            var state = history.state, call, now = that.geturl(),
                lstate = last.state, rcall, islast = that.check(state, "last");

            /* 修正点击 a 的伪类触发的点击事件会欺骗过点击过滤的问题 */
            if (state == null) {
                that.replace(lstate, lstate.title, last.url);
            } else {
                call = lstate.id > state.id ? "back" : "forward";

                if ( (state.clear === true  || now == last.url ) && !islast) {
                    islast &&　that.update();
                    history[call]();    // 略过 无记录 标记的 URL且当前项不是最后状态
                } else if (now != last.url) {
                    that.trigger(that.fire(), function(rcall) {
                        if (rcall === false) {
                            // before 执行失败则回退到上个页面
                            that.replace(lstate, lstate.title, last.url);
                        }
                    })
                }
            }
        });

        /* 页面跳转前检测，尝试阻止多余的URL跳转方法 */
        document.addEventListener(change, function(e) {
            var target = e.target, tag = target.tagName,
                href = target.getAttribute("href"), now = that.geturl();

            if (tag === "A" && href) {
                e.preventDefault(); /* 阻止浏览器默认跳转 */

                var match = that.fire(href), not, to;

                not = that.fire(opt.notpage) ? opt.notpage : opt.home;
                not = that.geturl(not);     // 修复URL格式
                to  = match ? href : not;   // 设置最终要跳转的URL
                
                to !== now &&that.go(to, false, !match && to == not);
            }
        }, false);
    }

    /* 判断给定的URL状态是不是当前状态表的最后一项 */
    Route.prototype.check = function(state, type) {
        var tables = this.state, len = tables.length-1, ret = false;

        if (state && type) {
            switch (type) {
                case "last" :
                    ret = state.id == tables[len].id;
                    break;
                case "first" : 
                    ret = state.id == tables[0].id;
                    break;
            }
        }

        return ret;     // 判断当前是否在指定的位置
    }

    /* 更新当前记录信息 */
    Route.prototype.update = function(url, match, state) {
        /* 更新当前路由的 last 记录信息 */
        this.last.url   = url   || this.geturl();
        this.last.match = match || this.fire();
        this.last.state = state || history.state;
    }

    /* 强制刷新，重新加载当前页面，但不触发 popstate 事件 */
    Route.prototype.refresh = function() {
        this.go(this.geturl(), true, false, true);

        return this;
    }

    /* 用给定的参数替换当前URL(无选择上次URL)，并不会触发 popstate 事件和方法执行 */
    Route.prototype.replace = function(state, title, url) {
        if (!state || !url) {
            state = this.last.state;
            title = state.title;
            url   = this.last.url;
        }

        history.replaceState(state, title, url);

        return this;
    }

    /* 跳到指定的页面 */
    Route.prototype.go = function(url, replace, clear, refresh) {
        var that = this, opt = that.options, call, last = that.last,
            state = {}, end, rcall, match = that.fire(url), now;

        /* 修正URL的格式，便于比较和计算 */
        url = that.geturl(url);     now = that.geturl();

        /* 要跳转的页面和当前页面不一样时才跳转 */
        if (match && (refresh || url != now )) {
            if (refresh && url === now) replace = true;

            /* 如果当前页面和上个页面一样，只不过参数不同，则转为替换模式 */
            if (last.match && last.match.length == match.length) {
                var ret = true;     // 用于记录每个匹配项是否相等

                for (var i = 0; i < match.length; i++) {
                    if (last.match[i].item != match[i].item) {
                        ret = false; break; // 退出检测
                    }
                }

                replace = ret ? true : replace;
            }

            end  = match[match.length-1];
            call = replace ? "replaceState" : "pushState";

            state.title = end && end.title ? end.title : ""; // 标题
            state.clear = clear || end.clear;          // 是否无记录模式

            that.trigger(match, null, function(rcall) {
                /* 进行具体的页面跳转，记录状态等动作 */
                if (rcall !== false) {
                    if (last && last.state && last.state.id < that.state.length) {
                        that.statpos = last.state.id;
                        that.state = that.state.slice(0, last.state.id-1);
                    }

                    state.id = ++that.statpos;      // 记录当前路由的序列ID

                    that.state.push(extend({}, state, {
                        match: match, url: url
                    }));
                    history[call](state, state.title, url);
                }

                return rcall;   // 返回 false，会阻止后续调用 update 方法
            })
        }
            
        return that;
    };

    /* 后退URL地址，目前直接调用浏览器的方法 */
    Route.prototype.back = function() {
        history.back();
    }

    /* 前进URL地址，目前直接调用浏览器的方法 */
    Route.prototype.forward = function() {
        history.forward();
    }

    /* 获取当前URL信息 */
    Route.prototype.geturl = function(url) {
        var that = this, opt = that.options, ret = "";

        if (opt.html5mode) {
            ret = url || location.pathname;
            ret = ret.replace(/^[#,\/]*/g, "/");
        } else {
            ret = url || location.hash;
            ret = ret.replace(/^[#,\/]*/g, "#");
        }

        return ret;
    }

    /* 添加一个路由信息
     * TODO: 加入子路由添加功能
     * */
    Route.prototype.on = function(url, option) {
        if (url || options) return false;

        var has = this.fire(url);

        if (has == null) {
            tables[url] = options;
            return true;
        } else {
            return false;   // 已经有此路由，操作失败
        }
    }

    /* 移除一个路由信息 */
    Route.prototype.off = function(url) {
        var tables = this.table;

        for(var key in tables) {
            if (key == url) {
                delete tables[key];

                return true;
            }
        }

        return false;   // 循环完还没删除，则返回失败
    }

    return window.Route = Route;
})(location, history);