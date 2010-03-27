/**
 * Provides Uploader widget
 *
 * @module gallery-uploader
 */

// local constants


var	getCN = Y.ClassNameManager.getClassName,

	UPLOADER = "uploader",
	CONTENT_BOX	= "contentBox",

	// class names
	LABEL  = "label",
	HEADER = "hd",
	BODY   = "bd",
	FOOTER = "ft",
	ENTRY  = "entry",

	// event names
	CLICK  = "click",
	ADD    = "add",
	REMOVE = "remove",
	UPLOAD = "upload",
	DONE   = "done",

	MB = 1024*1024,
	
	// BrowserPlus Services
	SERVICES = [
		{ service: "Uploader", version: "3" },
		{ service: "DragAndDrop", version: "2" },
		{ service: "FileBrowse", version: "2" },
		{ service: "Archiver", version: "1" }
	];




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

/**
 * The identity of the widget.
 *
 * @property UPLOADER
 * @type String
 * @static
 */
Uploader.NAME = UPLOADER;

/**
 * Attribute configuration for the Uploader widget.
 * 
 * @property Upload.ATTRS
 * @type Object
 * @static
 */
Uploader.ATTRS = {
	
	/**
	 * String with units, or number, representing the height of the Uploader,
	 * inclusive of header and footer. If a number is provided, the default
	 * unit, defined by Widget's DEF_UNIT, property is used.
	 *
	 * @attribute height
	 * @default "200px"
	 * @type {String | Number}
	 */
	height: {
		value: "200px"
	},

	/**
	 * String with units, or number, representing the width of the Uploader.
	 * If a number is provided, the default unit, defined by Widget's
	 * DEF_UNIT, property is used.
	 *
	 * @attribute width
	 * @default "400px"
	 * @type {String | Number}
	 */
	width: {
		value: "400px"
	},

	/**
	 * Maximum size in bytes of a single file.	Default is 2MB.  Set size to 0 or 
	 * less for no limit.
	 *
	 * @attribute maxFileSize
	 * @type Number
	 * @default 2097152 (2MB)
	 */
	maxFileSize: {
		value: 2*MB,
		validator: Y.isNumber
	},
	
	/**
	 * The optional cookie string POSTed to server during upload.
	 *
	 * @attribute cookie
	 * @type String
	 * @default null (cookie not sent)
	 */
	cookie: {
		value: null
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

	/**
	 * The localizable strings for the Uploader.
	 */
	strings: {
		value: {
			filename:        "Filename",
			file:            "File",
			files:           "Files",
			size:            "Size",
			upload_complete: "Upload Complete!",
			add_files:       "Add Files...",
			upload:          "Upload",
			total:           "Total:",
			size_b:	         " B",
			size_kb:         " KB",				   
			size_mb:         " MB",
			size_gb:         " GB",
			size_tb:         " TB"
		}
	}
};

/**
 * Map (object) of classNames used to populate the placeholders in the
 * Uploader.ENTRY_TEMPLATE markup when rendering a new Uploader entry.
 *
 * @property Upload.ENTRY_CSS
 * @type Object
 * @static
 */
Uploader.ENTRY_CSS = {
	entry_class	 : getCN(UPLOADER, ENTRY),
	entry_sel    : getCN(UPLOADER, ENTRY, "selected"),
	entry_name   : getCN(UPLOADER, ENTRY, "name"),
	entry_size   : getCN(UPLOADER, ENTRY, "size"),
	entry_action : getCN(UPLOADER, ENTRY, "action")
};

/**
 * Map (object) of classNames used to populate the placeholders in the
 * Uploader.HEADER_TEMPLATE, Uploader.BODY_TEMPLATE, and
 * Uploader.FOOTER_TEMPLATE markup when rendering the Uploader UI.
 *
 * @property Uploader.CHROME_CSS
 * @type Object
 * @static
 */
Uploader.CHROME_CSS = {
	hd_class		: getCN(UPLOADER, HEADER),
	bd_class		: getCN(UPLOADER, BODY),
	ft_class		: getCN(UPLOADER, FOOTER),
	bg_class		: getCN(UPLOADER, "bg"),
							
	hd_file_label	: getCN(UPLOADER, HEADER, "file",   LABEL),
	hd_size_label	: getCN(UPLOADER, HEADER, "size",   LABEL),
	hd_action_label : getCN(UPLOADER, HEADER, "action", LABEL),
	
	ft_files_class	: getCN(UPLOADER, FOOTER, "files"),
	ft_button_class : getCN(UPLOADER, FOOTER, "button"),
	ft_size_class	: getCN(UPLOADER, FOOTER, "size"),

	ft_num_label	: getCN(UPLOADER, FOOTER, "num",   LABEL),
	ft_files_label	: getCN(UPLOADER, FOOTER, "files", LABEL),
	ft_size_label	: getCN(UPLOADER, FOOTER, "size",  LABEL),
	ft_total_label	: getCN(UPLOADER, FOOTER, "total", LABEL)
};

/**
 * Markup template used to generate the DOM structure for the header
 * section of the Uploader when it is rendered.
 *
 * @property Uploader.HEADER_TEMPLATE
 * @type String
 * @static
 */
Uploader.HEADER_TEMPLATE =
	'<div class="{hd_class} {bg_class}">' +
		'<div class="{hd_file_label}">{str_file}</div>' +
		'<div class="{hd_size_label}">{str_size}</div>' +
		'<div class="{hd_action_label}"></div>' +
	'</div>';

/**
 * Markup template used to generate the DOM structure for the Uploader body.
 *
 * @property Uploader.BODY_TEMPLATE
 * @type String
 * @static
 */
Uploader.BODY_TEMPLATE = '<div class="{bd_class}"></div>';


/**
 * Markup template used to generate the DOM structure for a file.  A file
 * consists of a name, size and delete icon.
 *
 * @property Uploader.ENTRY_TEMPLATE
 * @type String
 * @static
 */
Uploader.ENTRY_TEMPLATE =
	'<div id="{str_guid}" class="{entry_class}">' + 
		'<div class="{entry_name}">{str_name}</div>' + 
		'<div class="{entry_size}">{str_size}</div>' + 
		'<div class="{entry_action}"></div>' + 
	'</div>';

/**
 * Markup template used to generate the DOM structure for the footer
 * section of the Uploader when it is rendered.
 *
 * @property Uploader.FOOTER_TEMPLATE
 * @type String
 * @static
 */
Uploader.FOOTER_TEMPLATE =
	'<div class="{ft_class} {bg_class}">'+
		'<div class="{ft_button_class}">' +
			'<button id="add_button" type="button">{str_add_files}</button>'+
			'<button id="upload_button" type="button">{str_upload}</button>'+
			'<span class="{ft_num_label}">{str_num}</span> ' +
			'<span class="{ft_files_label}">{str_files}</span>' +
		'</div>'+
		'<div class="{ft_size_class}">' +
			'<span class="{ft_total_label}">{str_total}</span> ' +
			'<span class="{ft_size_label}">{str_size}</span>' +
		'</div>'+
	'</div>';



Y.extend(Uploader, Y.Widget, {
	// Reference to the Node instance containing the header contents.
	_head: null,

	 // Reference to the Node instance that will house the console messages.
	_body: null,

	// Reference to the Node instance containing the footer contents.
	_foot: null,
	
	// List of BrowserPlus file handles to upload.
	_files: [],
	
	/** Convert number of bytes into human readable string (ala "2 MB") */
	_sizeInBytes: function(size) {
		var i, units = [
			this.get("strings.size_b"),
			this.get("strings.size_kb"),
			this.get("strings.size_mb"),
			this.get("strings.size_gb"),
			this.get("strings.size_tb")
		];

		for (i = 0; size > 1024; i++) { size /= 1024; }

		if (i < units.length) {
			return Math.round(size*10)/10 + units[i];
		} else {
			return "?";
		}
	},

	/** User added files to uploader through FileBrowse or DragAndDrop */
	_filesAdded:function(files) {
		var i, file, len = files.length;

		for (i = 0; i < len; i++) {
			file = files[i];
			// constraint checks go here, like max # files, file size, file type, etc

			// don't add files
			// TODO traverse them????
			if (file.mimeType != "application/x-folder") {
				file.fguid = Y.guid().replace(/-/g, "_");
				file.fname = file.BrowserPlusHandleName;
				file.fsize = this._sizeInBytes(file.size);
				this._files.push(file);
				this._renderFile(file);
			}
		}
	},
	
	/** Display just added file in UI */
	_renderFile: function(file) {

		var info = Y.merge(Uploader.ENTRY_CSS, {
			str_guid : file.fguid,
			str_name : file.fname,
			str_size : file.fsize
		});

		this._body.append(Y.substitute(Uploader.ENTRY_TEMPLATE, info));
	},

	/** User clicked Add Files... BrowserPlus.OpenBrowseDialog classed */
	_fileBrowser: function(e) {
		//var args = ConfigParams.mimeTypes ? {mimeTypes: ConfigParams.mimeTypes} : {};
		var that = this;

		YAHOO.bp.FileBrowse.OpenBrowseDialog({}, function(r) {
			if (r.success) {
				Y.log("TESTING IT: " + r.value.files);
				that._filesAdded(r.value.files);
			} else {
				alert("ERROR: " + r.error + " : " + r.verboseError);
			}
		});
	},
	
	// return the nearest ancestor (including the given node) with the specified className
	_getNodeOrAncestorWithClass: function(node, cn) {
		if (node.get("className") === cn) {
			return node;
		} else {
			return node.ancestor(function(n){return (n.get("className") === cn);});
		}
	},


	// user clicked in uploader body - highlight file entry or remove file action
	_fileClickEvent: function(e) {
		var node = e.target, id, cn = node.get("className");

		// TODO configurable file selection option ... maybe webdev doesn't
		// want selectable files / form
		
		// TODO don't highlight Upload until certain number of files condidtion is met ... 
		// exactly 2 or more than 5 or less than 3 files are selected ...
		// Actually, webdev should add this logic by listening to events and 
		// accepting / rejecting files
		

		// find nearest file entry
		node = this._getNodeOrAncestorWithClass(node, Uploader.ENTRY_CSS.entry_class);
		
		// blanket unhighlight
		Y.all("."+Uploader.ENTRY_CSS.entry_class).removeClass(Uploader.ENTRY_CSS.entry_sel);

		// user clicked on empty space
		if (!node) { return; }

		id = node.get("id");
		if (cn === Uploader.ENTRY_CSS.entry_action) {
			// user clicked on REMOVE action
			alert("Delete " + id);
		} else {
			// user clicked on file entry
			node.toggleClass(Uploader.ENTRY_CSS.entry_sel);
		}
	},

	/**
	 * Attach BrowserPlus specific events to UI after BrowserPlus has been initialized.
	 *
	 * @method _binder
	 * @protected
	 */
	 _binder: function() {
		Y.log("internal binder called!!" + this);
		this.get(CONTENT_BOX).query('#add_button').on(CLICK, this._fileBrowser,this);
		this._body.on(CLICK, this._fileClickEvent, this);
		//this.get(CONTENT_BOX).query("").on(CLICK, this._fileClickEvent, this);
	},

	/**
	 * Create the DOM structure for the header elements.
	 *
	 * @method _initHead
	 * @protected
	 */
	_initHead : function () {
		var cb	 = this.get(CONTENT_BOX),
			info = Y.merge(Uploader.CHROME_CSS, {
						str_file : this.get('strings.filename'),
						str_size : this.get('strings.size')
					});

		Y.log("init head");
		this._head = Y.Node.create(Y.substitute(Uploader.HEADER_TEMPLATE, info));
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
		Y.log("init body");
		this._body = Y.Node.create(Y.substitute(Uploader.BODY_TEMPLATE, Uploader.CHROME_CSS));
		this.get(CONTENT_BOX).appendChild(this._body);
	},

	/**
	 * Create the DOM structure for the footer elements.
	 *
	 * @method _initFoot
	 * @protected
	 */
	_initFoot : function () {
		Y.log("init footer");
		var info = Y.merge(Uploader.CHROME_CSS, {
						str_num	   : '0',
						str_files  : this.get('strings.files'),
						str_add_files	  : this.get('strings.add_files'),
						str_upload : this.get('strings.upload'),
						str_total  : this.get('strings.total'),
						str_size   : '0' + this.get('strings.size_kb')
					});

		this._foot = Y.Node.create(Y.substitute(Uploader.FOOTER_TEMPLATE, info));

		this.get(CONTENT_BOX).appendChild(this._foot);
	},

	initializer: function(){
		Y.log("initializer");
		this.publish(CLICK);  // file selected
		this.publish(ADD);    // file added to list
		this.publish(REMOVE); // file removed from list
		this.publish(UPLOAD); // file uploaded
		this.publish(DONE);   // all files uploaded
	},
			  
	destructor: function(){
		Y.log("destructor");
	},
	
	renderUI: function(){
		this._initHead();
		this._initBody();
		this._initFoot();
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
				YAHOO.bp.require({services: SERVICES}, function(require) {
					if (require.success) {
						that._binder();
					}
				});
			}
		});
	},
	
	syncUI: function(){
		Y.log("syncUI");
	}

});

Y.Base.build(Uploader.NAME, Uploader, {dynamic:false});
Y.namespace("BP.Uploader");
Y.BP.Uploader = Uploader;

