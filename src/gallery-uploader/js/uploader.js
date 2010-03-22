/**
 * Provides Uploader widget
 *
 * @module gallery-uploader
 */


/**
 * Uploader creates a file upload widget that allows the user to 
 * select or drag+drop multiple files from the desktop into it and
 * then upload multiple files at a time.
 *
 * @param config {Object} Object literal specifying Accordion configuration properties.
 *
 * @class Uploader
 * @constructor
 * @extends Widget
 */
function Uploader( config ){
    Uploader.superclass.constructor.apply( this, arguments );
}

// Local constants
var Lang = Y.Lang,

//    Node = Y.Node,
    isNumber = Lang.isNumber,

    substitute = Y.substitute,
    create     = Y.Node.create,
    merge      = Y.merge,

//    isString = Lang.isString,
    getCN = Y.ClassNameManager.getClassName,

    UPLOADER = 'uploader',
    CONSTRUCTOR = 'Uploader',
    NAMESPACE   = 'BPlus',

    CONTENT_BOX    = 'contentBox',
    ENTRY = 'entry',
    CLICK = 'click',

    // my real ones
    LABEL = 'label',
    HEADER = 'hd',
    BODY = 'bd',
    FOOTER = 'ft',


    DOT = '.',

    
    RequiredServices = [
        { service: "Uploader", version: "3" },
        { service: "DragAndDrop", version: "1" },
        { service: "FileBrowse", version: "1" }
    ],

    BP = YAHOO.BP;



    


Y.mix(Uploader, {
    
    /**
     * The identity of the widget.
     *
     * @property Console.NAME
     * @type String
     * @static
     */
    NAME : UPLOADER,

    /**
     * Map (object) of classNames used to populate the placeholders in the
     * Console.ENTRY_TEMPLATE markup when rendering a new Console entry.
     *
     * <p>By default, the keys contained in the object are:</p>
     * <ul>
     *    <li>entry_class</li>
     *    <li>entry_meta_class</li>
     *    <li>entry_cat_class</li>
     *    <li>entry_src_class</li>
     *    <li>entry_time_class</li>
     *    <li>entry_content_class</li>
     * </ul>
     *
     * @property Console.ENTRY_CLASSES
     * @type Object
     * @static
     */
    ENTRY_CLASSES : {
        entry_class        : getCN(UPLOADER, ENTRY),
        entry_name_label   : getCN(UPLOADER, ENTRY, 'name',   LABEL),  
        entry_size_label   : getCN(UPLOADER, ENTRY, 'size',   LABEL),
        entry_action_label : getCN(UPLOADER, ENTRY, 'action', LABEL)
    },

    /**
     * Map (object) of classNames used to populate the placeholders in the
     * Console.HEADER_TEMPLATE, Console.BODY_TEMPLATE, and
     * Console.FOOTER_TEMPLATE markup when rendering the Console UI.
     *
     * <p>By default, the keys contained in the object are:</p>
     * <ul>
     *   <li>console_hd_class</li>
     *   <li>console_bd_class</li>
     *   <li>console_ft_class</li>
     *   <li>console_controls_class</li>
     *   <li>console_checkbox_class</li>
     *   <li>console_pause_class</li>
     *   <li>console_pause_label</li>
     *   <li>console_button_class</li>
     *   <li>console_clear_class</li>
     *   <li>console_collapse_class</li>
     *   <li>console_title_class</li>
     * </ul>
     *
     * @property Console.CHROME_CLASSES
     * @type Object
     * @static
     */
    CHROME_CLASSES  : {
        hd_class        : getCN(UPLOADER, HEADER),
        bd_class        : getCN(UPLOADER, BODY),
        ft_class        : getCN(UPLOADER, FOOTER),
        bg_class        : getCN(UPLOADER, "bg"),
                                
        hd_file_label   : getCN(UPLOADER, HEADER, 'file', LABEL),
        hd_size_label   : getCN(UPLOADER, HEADER, 'size', LABEL),
        hd_action_label : getCN(UPLOADER, HEADER, 'action', LABEL),
        
        ft_files_class  : getCN(UPLOADER, FOOTER, 'files'),
        ft_button_class : getCN(UPLOADER, FOOTER, 'button'),
        ft_size_class   : getCN(UPLOADER, FOOTER, 'size'),

        ft_num_label    : getCN(UPLOADER, FOOTER, 'num',   LABEL),
        ft_files_label  : getCN(UPLOADER, FOOTER, 'files', LABEL),
        ft_size_label   : getCN(UPLOADER, FOOTER, 'size',  LABEL),
        ft_total_label  : getCN(UPLOADER, FOOTER, 'total', LABEL)
    },
    
    /**
     * Markup template used to generate the DOM structure for the header
     * section of the Console when it is rendered.  The template includes
     * these {placeholder}s:
     *
     * <ul>
     *   <li>console_button_class - contributed by Console.CHROME_CLASSES</li>
     *   <li>console_collapse_class - contributed by Console.CHROME_CLASSES</li>
     *   <li>console_hd_class - contributed by Console.CHROME_CLASSES</li>
     *   <li>console_title_class - contributed by Console.CHROME_CLASSES</li>
     *   <li>str_collapse - pulled from attribute strings.collapse</li>
     *   <li>str_title - pulled from attribute strings.title</li>
     * </ul>
     *
     * @property Console.HEADER_TEMPLATE
     * @type String
     * @static
     */
    HEADER_TEMPLATE : 
        '<div class="{hd_class} {bg_class}">' +
            '<div class="{hd_file_label}">{str_file}</div>' +
            '<div class="{hd_size_label}">{str_size}</div>' +
            '<div class="{hd_action_label}"></div>' +
        '</div>',

    /**
     * Markup template used to generate the DOM structure for the Console body
     * (where the messages are inserted) when it is rendered.  The template
     * includes only the {placeholder} &quot;console_bd_class&quot;, which is
     * constributed by Console.CHROME_CLASSES.
     *
     * @property Console.BODY_TEMPLATE
     * @type String
     * @static
     */
    BODY_TEMPLATE : '<div class="{bd_class}"></div>',

    ENTRY_TEMPLATE : 
        '<div id="{str_guid}" class="{entry_class}">' + 
            '<div class="{entry_name_label}">{str_name}</div>' + 
            '<div class="{entry_size_label}">{str_size}</div>' + 
            '<div class="{entry_action_label}"></div>' + 
        '</div>',

    /**
     * Markup template used to generate the DOM structure for the footer
     * section of the Console when it is rendered.  The template includes
     * many of the {placeholder}s from Console.CHROME_CLASSES as well as:
     *
     * <ul>
     *   <li>id_guid - generated unique id, relates the label and checkbox</li>
     *   <li>str_pause - pulled from attribute strings.pause</li>
     *   <li>str_clear - pulled from attribute strings.clear</li>
     * </ul>
     *
     * @property Console.FOOTER_TEMPLATE
     * @type String
     * @static
     */
    FOOTER_TEMPLATE :
        '<div class="{ft_class} {bg_class}">'+
            '<div class="{ft_button_class}">' +
                '<button type="button">{str_button}</button>'+
                '<span class="{ft_num_label}">{str_num}</span> ' +
                '<span class="{ft_files_label}">{str_files}</span>' +
            '</div>'+
            '<div class="{ft_size_class}">' +
                '<span class="{ft_total_label}">{str_total}</span> ' +
                '<span class="{ft_size_label}">{str_size}</span>' +
            '</div>'+
        '</div>',

    /**
     * Static property used to define the default attribute configuration for the Uploader.
     * 
     * @property Accordion.ATTRS
     * @type Object
     * @static
     */
    ATTRS : {
    
        /**
         * String with units, or number, representing the height of the Uploader,
         * inclusive of header and footer. If a number is provided, the default
         * unit, defined by Widget's DEF_UNIT, property is used.
         *
         * @attribute height
         * @default "300px"
         * @type {String | Number}
         */
        height: {
            value: "300px"
        },

        /**
         * String with units, or number, representing the width of the Uploader.
         * If a number is provided, the default unit, defined by Widget's
         * DEF_UNIT, property is used.
         *
         * @attribute width
         * @default "600px"
         * @type {String | Number}
         */
        width: {
            value: "600px"
        },

        /**
         * Maximum size in bytes of a single file.  Default is no limit.
         * @attribute printTimeout
         * @type Number
         * @default 0
         */
        maxFileSize: {
            value: 0,
            validator: isNumber
        },
    
        /**
         * The cookie(s) sent alone with the uploaded files.
         *
         * @attribute cookie
         * @type String
         * @default null (cookie not sent)
         */
        cookie: {
            value: "cookie monster"
        },

        /**
         * Archive and compress all files into a single ZIP file before upload.
         *
         * @attribute zipFiles
         * @type Boolean
         * @default false
         */
        zipFiles : {
            value : false
        },

        strings: {
            value: {
                filename: "Filename",
                file: "File",
                files: "Files",
                size: "Size",
                done: "Upload Complete!",
                button: "Add Files...",
                upload: "Upload",
                total: "Total:",
                size_b:  ' B',
                size_kb: ' KB',                
                size_mb: ' MB',
                size_gb: ' GB',
                size_tb: ' TB'
            }
        }
    }
});

Y.extend(Uploader, Y.Widget, {
    /**
     * Reference to the Node instance containing the header contents.
     *
     * @property _head
     * @type Node
     * @default null
     * @protected
     */
    _head    : null,

    /**
     * Reference to the Node instance that will house the console messages.
     *
     * @property _body
     * @type Node
     * @default null
     * @protected
     */
    _body    : null,

    /**
     * Reference to the Node instance containing the footer contents.
     *
     * @property _foot
     * @type Node
     * @default null
     * @protected
     */
    _foot    : null,
    
    /**
     * List of BrowserPlus file handles to upload.
     * 
     * @property _files
     * @type array
     * @default empty array
     * @private
     */
    _files : [],
    
    sizeInBytes:function(size) {
        var i, units = [
            this.get('strings.size_b'),
            this.get('strings.size_kb'),
            this.get('strings.size_mb'),
            this.get('strings.size_gb'),
            this.get('strings.size_tb')
        ];

        for (i = 0; size > 1024; i++) { 
            size /= 1024; 
        }

        if (i < units.length) {
            return Math.round(size*10)/10 + units[i];
        } else {
            return "?";
        }
    },

    initializer:function(){
        Y.log("initializer");
    },
              
    destructor: function(){
        Y.log("destructor");
    },
    
    renderUI: function(){
        var cb = this.get(CONTENT_BOX);
        Y.log("renderUI, cb="+cb);

        this._initHead();
        this._initBody();
        this._initFoot();
    },

    _filesSelected:function(files) {
        var i, file, len = files.length;

        for (i = 0; i < len; i++) {
            file = files[i];
            // constraint checks go here, like max # files, file size, file type, etc

            // don't add files
            // TODO traverse them????
            if (file.mimeType != "application/x-folder") {
                file.fguid = Y.guid().replace(/-/g, "_");
                file.fname = file.BrowserPlusHandleName;
                file.fsize = this.sizeInBytes(file.size);
                this._files.push(file);
                this._renderFile(file);
            }
        }
    },
    
    _renderFile:function(file) {



        var info = merge(Uploader.ENTRY_CLASSES, {
            str_guid : fule.fguid,
            str_name : file.fname,
            str_size : file.fsize
        });

        this._body.append(substitute(Uploader.ENTRY_TEMPLATE, info));
    },

    _fileBrowser:function(e) {
        //var args = ConfigParams.mimeTypes ? {mimeTypes: ConfigParams.mimeTypes} : {};
        var args = {recurse:true}, that = this;

		YAHOO.bp.FileBrowse.OpenBrowseDialog(args, function(r) {
            Y.log("TESTING IT");
            if (r.success) {
                that._filesSelected(r.value);
            }
        });
    },
    

    /**
     * Attach BrowserPlus specific events to UI after BrowserPlus has been initialized.
     *
     * @method _binder
     * @protected
     */
     _binder: function() {
        Y.log("internal binder called!!" + this);
        this.get(CONTENT_BOX).query('button').on(CLICK, this._fileBrowser,this);
    },

    /**
     * Initialize BrowserPlus and bind events to UI.
     * @method bindUI
     */
    bindUI: function(){
        Y.log("bind ui");
        var that = this;

        YAHOO.bp.init({},function(init) {
            if (init.success) {
                YAHOO.bp.require({services: RequiredServices}, function(require) {
                    if (require.success) {
                        that._binder();
                    }
                });
            }
        });
    },
    
    syncUI: function(){
        Y.log("syncUI");
    },

    /**
     * Create the DOM structure for the header elements.
     *
     * @method _initHead
     * @protected
     */
    _initHead : function () {
        var cb   = this.get(CONTENT_BOX),
            info = merge(Uploader.CHROME_CLASSES, {
                        str_file : this.get('strings.filename'),
                        str_size : this.get('strings.size')
                    });

        this._head = create(substitute(Uploader.HEADER_TEMPLATE, info));

        cb.insertBefore(this._head,cb.get('firstChild'));
    },

    /**
     * Create the DOM structure for the console body&#8212;where messages are
     * rendered.
     *
     * @method _initBody
     * @protected
     */
    _initBody : function () {
        this._body = create(substitute(Uploader.BODY_TEMPLATE, Uploader.CHROME_CLASSES));
        Y.on("click", function(){alert("click");}, this._body);
        this.get(CONTENT_BOX).appendChild(this._body);
    },

    /**
     * Create the DOM structure for the footer elements.
     *
     * @method _initFoot
     * @protected
     */
    _initFoot : function () {
        var info = merge(Uploader.CHROME_CLASSES, {
                        str_num    : '0',
                        str_files  : this.get('strings.files'),
                        str_button : this.get('strings.button'),
                        str_total  : this.get('strings.total'),
                        str_size   : '0' + this.get('strings.size_kb')
                    });

        this._foot = create(substitute(Uploader.FOOTER_TEMPLATE, info));

        this.get(CONTENT_BOX).appendChild(this._foot);
    }

});

Y.Base.build(Uploader.NAME, Uploader, {dynamic:false});
Y.namespace(NAMESPACE +'.'+CONSTRUCTOR);
Y[NAMESPACE][CONSTRUCTOR] = Uploader;
