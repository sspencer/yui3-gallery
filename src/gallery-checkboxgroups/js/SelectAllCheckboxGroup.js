/**********************************************************************
 * All checkboxes can be selected and a select-all checkbox is available
 * to check all. This check-all box is automatically changed if any other
 * checkbox changes state.
 */

function SelectAllCheckboxGroup(
	/* string/object */			select_all_cb,
	/* string/object/array */	cb_list)
{
	this.select_all_cb = Y.one(select_all_cb);
	this.select_all_cb.on('click', this.toggleSelectAll, this);

	SelectAllCheckboxGroup.superclass.constructor.call(this, cb_list);
}

Y.extend(SelectAllCheckboxGroup, CheckboxGroup,
{
	getSelectAllCheckbox: function()
	{
		return this.select_all_cb;
	},

	toggleSelectAll: function()
	{
		var checked = this.select_all_cb.get('checked');
		for (var i=0; i<this.cb_list.length; i++)
		{
			this.cb_list[i].set('checked', checked);
		}
	},

	enforceConstraints: function(
		/* array */	cb_list,
		/* int */	index)
	{
		this.select_all_cb.set('checked', this.allChecked());
	}
});

Y.SelectAllCheckboxGroup = SelectAllCheckboxGroup;
