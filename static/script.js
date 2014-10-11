;(function(){

  var data
  /*[{
    id: 0,
    status: '',
    tags: [''],
    title: '',
    ts: 0,
    _deleted: false
  }..]*/

  $(function(){
    $('body').delegate('form', 'submit', function(event){
      event.preventDefault() // prevent default
    })

    $('.task-list ul').sortable({
      connectWith: '.task-list ul',
      receive: function(event, ui){
        var $li = $(ui.item[0])
        var patch = {
          status: $li.closest('.task-list').attr('data-status')
        }
        $.ajax({
          type: 'patch',
          url: '/api/tasks/' + $li.attr('data-id'),
          data: {
            json: JSON.stringify(patch)
          },
          success: function(){
            loadTasks()
          }
        })
      }
    }).disableSelection()


    $('.dialog').dialog({
      autoOpen: false
    })
    $('#add-dialog').dialog({
      buttons: {
        'Add': addTask
      }
    })
    $('#update-dialog').dialog({
      buttons: {
        'Delete': deleteTask,
        'Update': updateTask
      }
    })

    $('#add-btn').on('click', function(){
      $('#add-dialog').dialog('open')
    })

    $('.task-list ul').delegate('li', 'click', function(){
      var $li = $(this)
      var task = _.findWhere(data.list, {
        id: parseInt($li.attr('data-id'))
      })
      var $dialog = $('#update-dialog')
      $dialog.find('[name="id"]').val(task.id)
      $dialog.find('[name="status"]').val(task.status)
      $dialog.find('[name="tags"]').val(task.tags.join('|'))
      $dialog.find('[name="title"]').val(task.title)
      $dialog.dialog('open')
    })
  })

  loadTasks()

  function loadTasks(){
    var match = location.href.match(/[\?&]tags=([^&#]*)/)
    var tags = match ? match[1] : null
    $.ajax({
      type: 'get',
      url: '/api/tasks',
      data: {
        tags: tags
      },
      success: function(_data){
        data = _data
        $(function(){
          initTasks()
        })
      }
    })
  }

  function initTasks(){
    var $todo = $('#todo-list ul').empty()
    var $doing = $('#doing-list ul').empty()
    var $done = $('#done-list ul').empty()
    _.each(data.list, function(task){
      if (task._deleted) return // deleted
      var $list = task.status === 'todo' ? $todo :
        task.status === 'doing' ? $doing :
        task.status === 'done' ? $done : null
      if ($list) {
        var prefix = task.tags.length <= 0 ? '' :
          task.tags.map(function(v){
            return '[' + v + ']'
          }).join(' ') + ' '
        $('<li>').addClass('ui-state-default')
          .text(prefix + task.title)
          .attr('data-id', task.id)
          .appendTo($list)
      }
    })
  }

  function addTask(){
    var $dialog = $('#add-dialog')
    var $form = $dialog.find('form')
    var task = {
      status: $form.find('[name="status"]').val(),
      // split trap
      tags: $form.find('[name="tags"]').val() ?
        $form.find('[name="tags"]').val().split('|') : [],
      title: $form.find('[name="title"]').val()
    }
    $.ajax({
      type: 'post',
      url: '/api/tasks',
      data: {
        'json': JSON.stringify(task)
      },
      success: function(){
        loadTasks()
        $form.find('input[type="text"], textarea').val('')
        $dialog.dialog('close')
      }
    })
  }

  function updateTask(){
    var $dialog = $('#update-dialog')
    var $form = $dialog.find('form')
    var task = {
      id: parseInt($form.find('[name="id"]').val()),
      status: $form.find('[name="status"]').val(),
      tags: $form.find('[name="tags"]').val() ?
        $form.find('[name="tags"]').val().split('|') : [],
      title: $form.find('[name="title"]').val()
    }
    $.ajax({
      type: 'patch',
      url: '/api/tasks/' + task.id,
      data: {
        'json': JSON.stringify(task)
      },
      success: function(){
        loadTasks()
        $form.find('input[type="text"], textarea').val('')
        $dialog.dialog('close')
      }
    })
  }

  function deleteTask(){
    var $dialog = $('#update-dialog')
    var $form = $dialog.find('form')
    $.ajax({
      type: 'delete',
      url: '/api/tasks/' + $form.find('[name="id"]').val(),
      success: function(){
        loadTasks()
        $form.find('input[type="text"], textarea').val('')
        $dialog.dialog('close')
      }
    })
  }
  

})()