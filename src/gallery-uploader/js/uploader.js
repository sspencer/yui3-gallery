/**
 * Provides Uploader widget
 *
 * @module gallery-uploader
 */

// local constants

// TODO don't highlight Upload until certain number of files condidtion is met ... 
// exactly 2 or more than 5 or less than 3 files are selected ...
// Actually, webdev should add this logic by listening to events and 
// accepting / rejecting files




var getCN = Y.ClassNameManager.getClassName,

	UPLOADER = "uploader",
	CONTENT_BOX = "contentBox",

	// class names
	LABEL  = "label",
	HEADER = "hd",
	BODY   = "bd",
	FOOTER = "ft",
	ENTRY  = "entry",
	BG	   = "bg",


	// EVENT NAMES

	// File List
	FILE_ADDED           = "fileAdded",	  
	FILE_REMOVED         = "fileRemoved",
	FILES_CHANGED        = "filesChanged",
	
	// Image Resize
	RESIZE_START         = "resizeStart",
	RESIZE_COMPLETE      = "resizeComplete",
	RESIZE_FILE_START    = "resizeFileStart",
	RESIZE_FILE_COMPLETE = "resizeFileComplete",	

	// document events like this??  found in animation.js
    //    /**
    //    * @event tween
    //    * @description fires every frame of the animation.
    //    * @param {Event} ev The tween event.
    //    * @type Event.Custom
    //    */
    //    TWEEN = 'tween',


	// Archive Events
	ARCHIVE_START		 = "archiveStart",
	ARCHIVE_PROGRESS	 = "archiveProgress",
	ARCHIVE_COMPLETE	 = "archiveComplete",

	// Uploading
	UPLOAD_START         = "uploadStart",
	UPLOAD_PROGRESS      = "uploadProgress",
	UPLOAD_FILE_START    = "uploadFileStart",
	UPLOAD_FILE_COMPLETE = "uploadFileComplete",
	UPLOAD_COMPLETE      = "uploadComplete",

	//FILE_UPLOADED	 = "fileUploaded",
	//FILE_PROGRESS	 = "fileProgress",

	//FILES_PROGRESS = "filesProgress", // percentage of all total
	//FILES_UPLOADED = "filesUploaded", // sent after all files uploaded
	
	// hmm ... also include transformation events
	//	 resizeStart resizeProgress resizeEnd
	//	 archiveStart archiveProgress archiveEnd
	// OR make it a part of overall progress
	//	 need a uploadStart type event that could be prevented just in case 
	//	 after all transoformations the filesize is too big 

	// yui uploader events:
	// http://developer.yahoo.com/yui/uploader/
	// uploadStart, uploadProgress, uploadCancel, uploadComplete, uploadCompleteData, uploadError

	MB = 1024*1024,
	
	// BrowserPlus Services
	SERVICES = [
		{ service: "Uploader", version: "3", minversion: "3.2.10" },
		{ service: "DragAndDrop", version: "2" },
		{ service: "Directory", version: "2" },
		{ service: "FileBrowse", version: "2" },
		{ service: "ImageAlter", version: "4" },
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
	 * Maximum size in bytes of a single file.	Default is 2MB.	 Set size to 0 or 
	 * less for no limit.
	 *
	 * @attribute maxFileSize
	 * @type Number
	 * @default 2097152 (2MB)
	 */
	maxFileSize: {
		value: 2*MB,
		validator: Y.Lang.isNumber
	},
	
	/**
	 * Maximum width of an uploaded image.	By default, uploaded images are not resized.  Set this
	 * value to non-zero to restrict the size of an image.
	 *
	 * @attribute resizeWidth
	 * @type Number
	 * @default 0 (don't scale image)
	 */
	resizeWidth: {
		value: 0,
		validator: Y.Lang.isNumber
	},

	/**
	 * Maximum height of an uploaded image.	By default, uploaded images are not resized.  Set this
	 * value to non-zero to restrict the size of an image.
	 *
	 * @attribute resizeHeight
	 * @type Number
	 * @default 0 (don't scale image)
	 */
	resizeHeight: {
		value: 0,
		validator: Y.Lang.isNumber
	},

	/**
	 * The quality of the scaled image (0-100).	 Lower qualities result in faster operations and 
	 * smaller file sizes, at the cost of image quality.
	 * @attribute quality
	 * @type Number
	 * @default 80
	 */
	resizeQuality: {
		value: 80,
		validator: function(val) {return (Y.Lang.isNumber(val) && val >= 0 && val <= 100);}
	},
	
	
	/**
	 * Set the optional archive + compression format.  When set, all files will be archived
	 * and compressed (depending on the format) into a single file before upload.  Used
	 * in conjunction with image resizing, upload speed should improve with less bits
	 * sent over the wire.  Valid values: ('tar', 'tar-bzip2', 'tar-gzip', 'zip', 'zip-uncompressed').
	 *
	 * @attribute archiveFormat
	 * @type String
	 * @default null
	 */
	archiveFormat: {
		value: null,
		validator: function(val) {
			switch(val) {
				case 'zip':
				case 'zip-uncompressed':
				case 'tar':
				case 'tar-gzip':
				case 'tar-bzip2':
					return true;
				default:
					return false;
			}
		}
	},


	// compress
	// fieldName - The name of the variable in the POST request containing the file data. "Filedata" by default.
	// vars <Object> The object containing variables to be sent in the same request as the file upload.

	/**
	 * @description An array of mimeTypes for which the selected files will be filtered
	 *
	 * @attribute mimeTypes
	 * @default []
	 * @type Array
	 */
	mimeTypes: {
		value: [],
		validator: Y.Lang.isArray
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
	 * Array of files that are going to be uploaded.  Each file is a object that
	 * contains {name, size, TBD}.
	 * 
	 * @attribute files
	 * @readOnly
	 * @default []
	 * @type Array
	 */
	files: {
		value: [],
		readOnly: true,
		validator: Y.Lang.isArray
	},
	
	/**
	 * The URL of the upload script on the server.	If this value is not set, 
	 * not files will be uploaded.
	 * 
	 * @attribute url
	 * @default null
	 * @type String
	 */
	url: {
		value: null
	},

	/**
	 * An optional flat data object (name/value strings) that is posted with each file uploaded.  
	 * This may be set during the uploadStart event so you can gather data from a form before
	 * the files are uploaded.
	 */
	data: {
		value:null,
		validator: Y.Lang.isObject
	},

	/**
	 * The localizable strings for the Uploader.
	 */
	strings: {
		value: {
			filename:		 "File",
			size:			 "Size",
			upload_complete: "Upload Complete!",
			add_files:		 "Add Files...",
			drop_files:		 "Drop Files",
			upload:			 "Upload",
			total:			 "Total:",
			size_b:			 " B",
			size_kb:		 " KB",				   
			size_mb:		 " MB",
			size_gb:		 " GB",
			size_tb:		 " TB"
		}
	}
};

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
 * Map (object) of classNames used to populate the placeholders in the
 * Uploader.ENTRY_TEMPLATE markup when rendering a new Uploader entry.
 *
 * @property Upload.ENTRY_CSS
 * @type Object
 * @static
 */
Uploader.ENTRY_CSS = {
	entry_class	 : getCN(UPLOADER, ENTRY),
	entry_sel	 : getCN(UPLOADER, ENTRY, "selected"),
	entry_name	 : getCN(UPLOADER, ENTRY, "name"),
	entry_size	 : getCN(UPLOADER, ENTRY, "size"),
	entry_action : getCN(UPLOADER, ENTRY, "action")
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
 * Map (object) of classNames used to populate the placeholders in the
 * Uploader.HEADER_TEMPLATE markup when rendering the Uploader UI.
 *
 * @property Uploader.HEADER_CSS
 * @type Object
 * @static
 */
Uploader.HEADER_CSS = {
	hd_class		: getCN(UPLOADER, HEADER),
	bg_class		: getCN(UPLOADER, BG),
	hd_file_label	: getCN(UPLOADER, HEADER, "file",	LABEL),
	hd_size_label	: getCN(UPLOADER, HEADER, "size",	LABEL),
	hd_action_label : getCN(UPLOADER, HEADER, "action", LABEL)
};

/**
 * Markup template used to generate the DOM structure for the Uploader body.
 *
 * @property Uploader.BODY_TEMPLATE
 * @type String
 * @static
 */
Uploader.BODY_TEMPLATE = 
	'<div>' +
		'<div id="{filelist_id}" class="{bd_class} {filelist_class}"></div>'+ 
		'<div style="visibility:hidden" class="{bd_class} {message_class}"></div>' +
		'<div style="visibility:hidden" class="{bd_class} {progress_class}"></div>' +
		'<div style="visibility:hidden" class="{bd_class} {hover_class}">' + 
			'<div class="{hover_text}">{str_drop_files}</div>' + 
		'</div>' +
	'</div>';

/**
 * Map (object) of classNames used to populate the placeholders in the
 * Uploader.BODY_TEMPLATE markup when rendering the Uploader UI.
 *
 * @property Uploader.HEADER_CSS
 * @type Object
 * @static
 */
Uploader.BODY_CSS = {
	bd_class		: getCN(UPLOADER, BODY),
	hover_class		: getCN(UPLOADER, "hover"),
	hover_text		: getCN(UPLOADER, "hover", "text"),
	filelist_class	: getCN(UPLOADER, "filelist"),	// file list
	message_class	: getCN(UPLOADER, "message"),	// error message
	progress_class	: getCN(UPLOADER, "progress")	// upload progress
};

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
			'<button disabled id="add_button" type="button">{str_add_files}</button>'+
			'<button disabled id="upload_button" type="button">{str_upload}</button>'+
		'</div>'+
		'<div class="{ft_size_class}">' +
			'<span class="{ft_total_label}">{str_total}</span> ' +
			'<span class="{ft_size_label}">{str_size}</span>' +
		'</div>'+
	'</div>';

Uploader.FOOTER_CSS = {
	ft_class		: getCN(UPLOADER, FOOTER),
	bg_class		: getCN(UPLOADER, BG),

	ft_files_class	: getCN(UPLOADER, FOOTER, "files"),
	ft_button_class : getCN(UPLOADER, FOOTER, "button"),
	ft_size_class	: getCN(UPLOADER, FOOTER, "size"),

	ft_size_label	: getCN(UPLOADER, FOOTER, "size",  LABEL),
	ft_total_label	: getCN(UPLOADER, FOOTER, "total", LABEL)
};



Y.extend(Uploader, Y.Widget, {
	// the box this widget is renedered into
	_contentBox: null,
	
	 // Reference to the Node instance that will house the console messages.
	_body: null,
	
	// Reference to the Node instance containing the footer contents.
	_foot: null,

	// maybe need messages and progress too
	_filelist: null,

	// message that shows when user drags files over uploader body panel
	_hoverpane: null,

	// error message panel
	// _messagepane: null, 
	
	
	/** Convert number of bytes into human readable string (ala "2 MB") */
	sizeInBytes: function(size) {
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

	/**
	 * Clears the list of files queued for upload.
	 */
	clearFileList: function() {
		if (this.get("disabledInput")) {return;}
		
		var len = this.get("files").length;

		// remove file entries from ui
		this._filelist.all("." + Uploader.ENTRY_CSS.entry_class).remove();

		// remove files entries array
		this.get("files").splice(0, len); 

		this.fire(FILES_CHANGED);
	},
	
	/**
	 * Set the enabled state of the Add Files button.
	 */
	enableAddButton: function(enabled) {
		this._contentBox.query('#add_button').set("disabled", !enabled);
	},

	/**
	 * Set the enabled state of the Upload button.
	 */
	enableUploadButton: function(enabled) {
		this._contentBox.query('#upload_button').set("disabled", !enabled);
	},

	/**
	 * Disable the Uploader widget.
	 */
	disable: function() {
		Uploader.superclass.disable.call(this);
		this.set("disabledInput", true);
		this.enableAddButton(false);
		this.enableUploadButton(false);
	},

	/**
	 * Enable the Uploader widget.
	 */
	enable: function() {
		var numfiles = this.get("files").length;
		this.set("disabledInput", false);
		Uploader.superclass.enable.call(this);
		this.enableAddButton(true);
		this.enableUploadButton(numfiles > 0);
	},
	
	// http://developer.yahoo.com/yui/docs/YAHOO.widget.Uploader.html
	// cancel - cancel one or all files from uploading
	// removeFile - removes the specified file from the upload queue.
	// setAllowLogging(boolean)
	// setAllowMultipleFiles(boolean)
	// setFileFilters
	// setSimUploadLimit(1-5 ) - sets the number of simultaneous uploads
	// upload(fileID,...)
	// uploadAll()
	// uploadThese()


	// return index of file indentified by 'id' or return -1
	_getFileIndex: function(id) {
		var i, len, files = this.get("files");
		for (i = 0, len = files.length; i < len; i++) {
			if (id === files[i].id) {
				return i;
			}
		}
		return -1;
	},

	// search through files array and return index of entry with same handle id.
	_getHandleIndex: function(handle) {
		var i, len, files = this.get("files");
		for (i = 0, len = files.length; i < len; i++) {
			if (handle === files[i].BrowserPlusHandleID) {
				return i;
			}
		}
		return -1;
	},

	_addFilesToList: function(files) {
		var dirArgs = {files: files},
			mimeTypes = this.get("mimeTypes"),
			that = this;
		
		if (mimeTypes.length > 0) { dirArgs.mimetypes = this.get("mimeTypes"); }

		BrowserPlus.Directory.recursiveList(dirArgs, function(res) {
			var i, file, files, maxFileSize;

			if (!res.success) { return; }

			maxFileSize = that.get("maxFileSize");

			files = res.value.files;
			for (i = 0; i < files.length; i++) {
				file = files[i];

				// don't add duplicate files
				if (that._getHandleIndex(file.BrowserPlusHandleID) === -1) {
					// ignore directories, only care about files now
					if (file.mimeType[0] === "application/x-folder") { continue; }

					// if there's no max set OR file size < max, add file to Uploader
					if (maxFileSize < 1 || file.size <= maxFileSize) {
						file.id = Y.guid().replace(/-/g, "_");
						that.fire(FILE_ADDED, { file: file });
					}
				}
			}

			// done adding files, fire meta event
			that.fire(FILES_CHANGED);
		});
	},

	
	/** Display just added file in UI */
	_fileAddedEvent: function(e) {
		// remember file
		this.get("files").push(e.file);

		
		// add file to ui
		var css = Y.merge(Uploader.ENTRY_CSS, {
			str_guid : e.file.id,
			str_name : e.file.name,
			str_size : this.sizeInBytes(e.file.size)
		});

		this._filelist.append(Y.substitute(Uploader.ENTRY_TEMPLATE, css));
	},

	// TODO - remove me, for dbg only
	printfiles: function() {
		var i, files = this.get("files");
		for (i = 0; i < files.length; i++) {
			Y.log("...[" + i + "] " + files[i].id + " " + files[i].name);
		}
	},

	_fileRemovedEvent: function(e) {
		var index = this._getFileIndex(e.file.id);
		if (index !== -1) {
			this.get("files").splice(index, 1); // changes array in place
			Y.one("#"+e.file.id).remove(); // remove from UI
		}
	},

	_filesChangedEvent: function() {
		// disable upload button when there are no files
		var i, size=0, files = this.get("files"), numfiles = files.length;

		// only set enabled button when there are files in list to upload
		this.enableUploadButton(numfiles > 0);


		// recalculate total size
		for(i = 0; i < numfiles; i++) {
			size += files[i].size;
		}

		this.set("fileSize", size);
		this._foot.one("." + Uploader.FOOTER_CSS.ft_size_label).setContent(this.sizeInBytes(size));
	},

	/** User clicked Add Files... BrowserPlus.OpenBrowseDialog classed */
	_openFileDialog: function(e) {
		if (this.get("disabledInput")) {return;}
		var that = this;

		YAHOO.bp.FileBrowse.OpenBrowseDialog({}, function(r) {
			if (r.success) {
				that._addFilesToList(r.value.files);
			}
		});
	},

	/**
	 * Returns true if file's mimetype matches a known image mime type (matches
	 * image/gif, image/jpeg, image/pjpeg, image/png)
	 */
	_isImage: function(f) {
		var i;
		for (i = 0; i < f.mimeType.length; i++) {
			switch(f.mimeType[i]) {
				case "image/gif":
				case "image/jpeg":
				case "image/pjpeg":
				case "image/png":
					return true;
				default:
					continue;
			}
		}
		
		return false;
	},
	
	/**
	 * Resize single file if it is an image.  To resize an image, the mimeType must be one of
	 * ("image/gif", "image/jpeg", "image/pjpeg", "image/png") and resizeWidth or resizeHeight must
	 * be more than 0.
	*/
	_resizeImage: function(file, cb) {
		var maxWidth = this.get("resizeWidth"),
			maxHeight = this.get("resizeHeight"),
			quality = this.get("resizeQuality"),
			that = this;

		if ((maxWidth > 0 || maxHeight > 0) && this._isImage(file)) {
			// so resize event is only sent when there are images to resize
			if (this.get("sendResizeStart") === true) {
				this.fire(RESIZE_START);
				this.set("sendResizeStart", false);   // so RESIZE_START sent once per upload
				this.set("sendResizeComplete", true); // so RESIZE_COMPLETE sent at end
			}

			this.fire(RESIZE_FILE_START, {file: file});
			BrowserPlus.ImageAlter.transform( 
				{
					file : file,
					quality : quality,
					actions : [{ scale : { maxwidth	 : maxWidth, maxheight : maxHeight } }]
				}, 
				function(res) { 
					var f = (res.success ? res.value.file : file);
					that.fire(RESIZE_FILE_COMPLETE, {file: f});
					cb(f);
				}
			);
		} else {
			cb(file);
		}
	},

	// resize all images
	_resizeImages: function(filesInList, doneCB) {
		var i, numfiles = filesInList.length, filesToUpload = [], resizedImageCB;

		resizedImageCB = function(f) {
			filesToUpload.push(f);
			if (filesToUpload.length === numfiles) {
				// this.fire(INT_RESIZED, filesToUpload);
				doneCB(filesToUpload);
			}
		};

		for (i = 0; i < numfiles; i++) {
			this._resizeImage(filesInList[i], resizedImageCB);
		}
	},

	_archiveFiles: function(files, archiveFormat, cb) {
		var that = this;
		if (archiveFormat) {
			this.fire(ARCHIVE_START, this.get("fileSize"));
			BrowserPlus.Archiver.archive(
				{
					files:	files,
					format: archiveFormat,
					progressCallback: function(v) {
						that.fire(ARCHIVE_PROGRESS, v.percent);
					}
				},
				function(res) {
					var f = (res.success ? res.value.archiveFile : files );
					that.fire(ARCHIVE_COMPLETE, f.size);
					cb(f);
				}
			);
		} else {
			cb(files);
		}
	},
	_uploadImagesResized: function(e) {
		Y.log("_uploadImagesResized called, cool");
	},

	_uploadFiles: function(e) {
		var that = this;

		// disallow user input while uploading
		this.set("disabledInput", true);
		this.enableAddButton(false);
		this.enableUploadButton(false);

		// guarantee RESIZE events are only sent when images are actually resized
		this.set("sendResizeStart", true);
		this.set("sendResizeComplete", false);
		
		// resize images (only if needed)
		this._resizeImages(this.get("files"), function(files) {

			// only send if there was a RESIZE_START
			if (that.get("sendResizeComplete") === true) {
				that.fire(RESIZE_COMPLETE); 
			}

			that.fire("upload_resized");
			// INT_RESIZED
			// INT_ARCHIVED
			//
			
			// archiveFiles determines whether or not to actually archive files
			that._archiveFiles(files, that.get("archiveFormat"), function(filesToUpload) {
				Y.log("Really Upload Files");

				// allow user input again
				that.set("disabledInput", false);
				that.enableAddButton(true);
				that.enableUploadButton(false); // no files, no upload
				that.clearFileList();
			});
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


	// user clicked in uploader body - see if click is on delete button
	_fileClickEvent: function(e) {
		if (this.get("disabledInput")) {return;}

		var node = e.target, cn = node.get("className"), index;

		// clicked on delete action
		if (cn === Uploader.ENTRY_CSS.entry_action) {
			// find nearest file entry
			node = this._getNodeOrAncestorWithClass(node, Uploader.ENTRY_CSS.entry_class);
			if (node) {
				e.preventDefault();

				// user clicked on REMOVE action
				index = this._getFileIndex(node.get("id"));
					
				if (index != -1) {
					this.fire(FILE_REMOVED, {file: this.get("files")[index]});
					this.fire(FILES_CHANGED);
				}
			}
		}
	},


	/**
	 * Attach BrowserPlus specific events to UI after BrowserPlus has been initialized.
	 *
	 * @method _binder
	 * @protected
	 */
	 _binder: function() {
		var hover = this._hoverpane, id = this._filelist.get("id"), that = this;

		this._contentBox.query('#add_button').on("click", this._openFileDialog, this);
		this._contentBox.query('#upload_button').on("click", this._uploadFiles, this);
		this.enableAddButton(true);
		this.set("disabledInput", false);

		this._filelist.on("click", this._fileClickEvent, this);


		BrowserPlus.DragAndDrop.AddDropTarget({ id: id}, function (r) {
			if (r.success) {
				BrowserPlus.DragAndDrop.AttachCallbacks({id: id, 
					hover: function(hovering) {
						if (that.get("disabledInput")) {return;}

						var visible = hover.getStyle("visibility");
						// only set property once
						if (hovering && visible != "visible") {
							hover.setStyle("visibility", "visible");
						} else if (!hovering && visible == "visible") {
							hover.setStyle("visibility", "hidden");
						}
					}, 
					drop: function(files) {
						if (that.get("disabledInput")) {return;}
						hover.setStyle("visibility", "hidden");
						that._addFilesToList(files);
					}
				},	function() {});
			}
		});
	},

	/**
	 * Create the DOM structure for the header elements.
	 *
	 * @method _initHead
	 * @protected
	 */
	_initHead : function () {
		var node,
			css = Y.merge(Uploader.HEADER_CSS, {
					str_file : this.get('strings.filename'),
					str_size : this.get('strings.size')
				});

		node = Y.Node.create(Y.substitute(Uploader.HEADER_TEMPLATE, css));
		this._contentBox.insertBefore(node, this._contentBox.get('firstChild'));
	},

	/**
	 * Create the DOM structure for the console body&#8212;where messages are
	 * rendered.
	 *
	 * @method _initBody
	 * @protected
	 */
	_initBody : function () {
		var id = Y.guid(),
			css = Y.merge(Uploader.BODY_CSS, { 
				filelist_id	   : id ,
				str_drop_files : this.get('strings.drop_files')
			});

		this._body = Y.Node.create(Y.substitute(Uploader.BODY_TEMPLATE, css));

		this._filelist	= this._body.one("." + css.filelist_class);
		this._hoverpane = this._body.one("." + css.hover_class);

		this._contentBox.appendChild(this._body);
	},

	/**
	 * Create the DOM structure for the footer elements.
	 *
	 * @method _initFoot
	 * @protected
	 */
	_initFoot : function () {
		var css = Y.merge(Uploader.FOOTER_CSS, {
			str_add_files : this.get('strings.add_files'),
			str_upload	  : this.get('strings.upload'),
			str_total	  : this.get('strings.total'),
			str_size	  : '0' + this.get('strings.size_kb')
		});

		this._foot = Y.Node.create(Y.substitute(Uploader.FOOTER_TEMPLATE, css));
		this._contentBox.appendChild(this._foot);
	},

	initializer: function(){
		this.publish(FILE_ADDED);	 // 1 file added
		this.publish(FILE_REMOVED);	 // 1 file removed
		this.publish(FILES_CHANGED); // after files added or removed

		this.publish(RESIZE_START); 
		this.publish(RESIZE_FILE_START); 
		this.publish(RESIZE_FILE_COMPLETE); 
		this.publish(RESIZE_COMPLETE); 
		
		this.publish(ARCHIVE_START);
		this.publish(ARCHIVE_PROGRESS);
		this.publish(ARCHIVE_COMPLETE);

		this.publish(UPLOAD_START);
		this.publish(UPLOAD_PROGRESS);
		this.publish(UPLOAD_FILE_START);
		this.publish(UPLOAD_FILE_COMPLETE);
		this.publish(UPLOAD_COMPLETE);
	},
			  
	destructor: function(){
	},
	
	renderUI: function(){
		// this widget's outer most box
		this._contentBox = this.get(CONTENT_BOX);

		this._initHead();
		this._initBody();
		this._initFoot();
	},

	/**
	 * Initialize BrowserPlus and bind events to UI.
	 * @method bindUI
	 */
	bindUI: function(){
		var that = this;

		this.after(FILE_ADDED, this._fileAddedEvent, this);
		this.after(FILE_REMOVED, this._fileRemovedEvent, this);
		this.after(FILES_CHANGED, this._filesChangedEvent, this);

		this.on("upload_resized", this._uploadImagesResized, this);


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
	
	syncUI: function() {
		// sync or bind, that is the question
	}

});

Y.Base.build(Uploader.NAME, Uploader, {dynamic:false});
Y.namespace("BP.Uploader");
Y.BP.Uploader = Uploader;

