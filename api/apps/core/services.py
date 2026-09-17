def sync_file_attachments(
        *,
        document,
        file_model,
        uploaded_files,
        deleted_file_ids
):
    if deleted_file_ids:
        file_model.objects.filter(id__in=deleted_file_ids, document=document).delete()

    for file in uploaded_files:
        file_model.objects.create(document=document, file=file, name=file.name)


def sync_link_attachments(
        *,
        document,
        link_model,
        links_data,
        deleted_link_ids,
):
    if deleted_link_ids:
        link_model.objects.filter(id__in=deleted_link_ids, document=document).delete()

    for link in links_data:
        link_id = link.get("id")

        if link_id:
            link_obj = link_model.objects.filter(id=link_id, document=document).first()
            if link_obj:
                for field in ('url', 'name', 'is_video_embed'):
                    if field in link:
                        setattr(link_obj, field, link[field])
                link_obj.save()
        else:
            link_model.objects.create(document=document, **link)


def sync_attachments(
        *,
        document,
        file_model,
        uploaded_files,
        deleted_file_ids,
        link_model,
        links_data,
        deleted_link_ids,
):
    sync_file_attachments(
        document=document,
        file_model=file_model,
        uploaded_files=uploaded_files,
        deleted_file_ids=deleted_file_ids,
    )

    sync_link_attachments(
        document=document,
        link_model=link_model,
        links_data=links_data,
        deleted_link_ids=deleted_link_ids,
    )
